// ===== 邮箱验证码功能 - Auth Service (整合邮箱登录注册) =====
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/models/user.entity';
import { Result } from '../../common/dto/result.type';
import * as CODE from '../../common/constants/code';
import { getMsg } from '../../shared/utils/msg';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    // 初始化邮件发送器
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('EMAIL_HOST') || 'smtp.163.com',
      port: parseInt(this.config.get<string>('EMAIL_PORT') || '465', 10),
      secure: this.config.get<string>('EMAIL_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('EMAIL_USER') || '',
        pass: this.config.get<string>('EMAIL_PASS') || '',
      },
    });
  }

  // ===== 原有注册逻辑（用户名+密码，bcrypt加密） =====
  async register(input: { username: string; password: string; role: UserRole }) {
    const exists = await this.users.findByUsername(input.username);
    if (exists) throw new BadRequestException('Username already exists');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.users.createUser({
      username: input.username,
      passwordHash,
      role: input.role,
    });

    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user };
  }

  // ===== 原有登录逻辑（用户名+密码，bcrypt校验） =====
  async login(input: { username: string; password: string }) {
    const user = await this.users.findByUsername(input.username);
    if (!user) throw new UnauthorizedException('用户名或密码错误');

    // 1. 检查锁定状态
    if (user.loginFailLockUntil && new Date(user.loginFailLockUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.loginFailLockUntil).getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`账户已锁定，请${remainingMinutes}分钟后再试`);
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);

    // 2. 密码错误处理
    if (!isValid) {
      const failCount = (user.loginFailCount || 0) + 1;
      const MAX_FAIL_COUNT = 5; // 最大失败次数
      const LOCK_MINUTES = 10;  // 锁定时间（分钟）

      if (failCount >= MAX_FAIL_COUNT) {
        // 达到阈值，锁定账户
        await this.users.repo.update(user.id, {
          loginFailCount: failCount,
          loginFailLockUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000),
        });
        throw new UnauthorizedException(`密码错误次数过多，账户已锁定${LOCK_MINUTES}分钟`);
      } else {
        // 未达阈值，仅增加计数
        await this.users.repo.update(user.id, { loginFailCount: failCount });
        throw new UnauthorizedException(`密码错误，还剩${MAX_FAIL_COUNT - failCount}次机会`);
      }
    }

    // 3. 登录成功，重置计数和锁定
    if ((user.loginFailCount || 0) > 0 || user.loginFailLockUntil) {
      await this.users.repo.update(user.id, {
        loginFailCount: 0,
        loginFailLockUntil: null,
      });
    }

    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user };
  }

  // ===== 邮箱验证码功能：发送验证码（不创建用户） =====
  async sendEmailCode(email: string): Promise<Result> {
    // 邮箱格式校验（保持与前端一致）
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { code: 400, message: '请输入有效的邮箱地址' };
    }

    const user = await this.users.findByEmail(email);

    // 防邮件轰炸：检查发送间隔
    if (user?.lastEmailSentAt) {
      const diff = Date.now() - new Date(user.lastEmailSentAt).getTime();
      const interval = parseInt(this.config.get('EMAIL_SEND_INTERVAL_SECONDS', '60'), 10) * 1000;
      if (diff < interval) {
        return { code: 429, message: `请${Math.ceil((interval - diff) / 1000)}秒后再试` };
      }
    }

    // 生成6位验证码
    const code = Math.random().toString().slice(2, 8).padStart(6, '0');
    const expiry = new Date(Date.now() + parseInt(this.config.get('EMAIL_CODE_EXPIRE_MINUTES', '5'), 10) * 60 * 1000);

    // 如果用户存在，更新验证码；否则创建临时验证码记录
    if (user) {
      await this.users.repo.update(user.id, {
        emailVerifyCode: code,
        emailVerifyCodeExpiry: expiry,
        emailVerifyFailCount: 0,
        lastEmailSentAt: new Date(),
      });
    } else {
      // 用户不存在时，创建临时用户记录用于存储验证码
      try {
       const tempPassword = 'pending_verification';
        const newUser = await this.users.repo.save(
          this.users.repo.create({
            username: email, // 临时用户使用邮箱作为用户名
            email,
            passwordHash: tempPassword,
            role: UserRole.MERCHANT, // 临时设置默认角色，注册时会更新
            emailVerifyCode: code,
            emailVerifyCodeExpiry: expiry,
            emailVerifyFailCount: 0,
            lastEmailSentAt: new Date(),
          })
        );
        console.log('临时用户创建成功，验证码:', code, '邮箱:', email, '用户ID:', newUser.id);
      } catch (error) {
        console.error('创建临时用户失败:', error);
        return { code: 500, message: '系统错误，请稍后再试' };
      }
    }

    // 发送邮件
    try {
      await this.transporter.sendMail({
        from: this.config.get('EMAIL_FROM'),
        to: email,
        subject: '易宿酒店预定平台 - 验证码',
        html: `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1>易宿酒店预定平台</h1>
            <h2>您的验证码</h2>
            <p>您正在使用邮箱进行登录/注册，验证码为：</p>
            <h1 style="color: #1890ff; letter-spacing: 5px;">${code}</h1>
            <p>验证码有效期为 ${this.config.get('EMAIL_CODE_EXPIRE_MINUTES', '5')} 分钟，请勿泄露给他人。</p>
          </div>
        `,
      });

      return { code: CODE.SUCCESS, message: '验证码已发送' };
    } catch (error) {
      console.error('邮件发送失败:', error);
      return { code: 500, message: '验证码发送失败，请稍后再试' };
    }
  }

  // ===== 邮箱验证码功能：邮箱登录 =====
  async emailLogin(email: string, code: string): Promise<Result> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      return { code: CODE.EMAIL_NOT_FOUND, message: '邮箱尚未注册' };
    }

    // 检查锁定
    if (user.emailVerifyFailLockUntil && new Date(user.emailVerifyFailLockUntil) > new Date()) {
      const remain = Math.ceil((new Date(user.emailVerifyFailLockUntil).getTime() - Date.now()) / 60000);
      return { code: 403, message: `验证失败次数过多，请${remain}分钟后再试` };
    }

    if (!user.emailVerifyCode || !user.emailVerifyCodeExpiry) {
      return { code: CODE.EMAIL_CODE_NOT_SENT, message: '验证码不存在，请先发送验证码' };
    }

    // 检查过期
    if (new Date(user.emailVerifyCodeExpiry) < new Date()) {
      return { code: CODE.EMAIL_CODE_EXPIRED, message: '验证码已过期' };
    }

    // 校验验证码
    if (user.emailVerifyCode !== code) {
      const failCount = (user.emailVerifyFailCount || 0) + 1;
      const maxFail = parseInt(this.config.get('EMAIL_CODE_FAIL_MAX_COUNT', '5'), 10);

      if (failCount >= maxFail) {
        const lockMinutes = parseInt(this.config.get('EMAIL_CODE_FAIL_LOCK_MINUTES', '10'), 10);
        await this.users.repo.update(user.id, {
          emailVerifyFailCount: failCount,
          emailVerifyFailLockUntil: new Date(Date.now() + lockMinutes * 60 * 1000),
        });
        return { code: 403, message: `验证码错误次数过多，已锁定${lockMinutes}分钟` };
      }

      await this.users.repo.update(user.id, { emailVerifyFailCount: failCount });
      return { code: CODE.LOGIN_ERROR, message: `验证码错误，还剩${maxFail - failCount}次机会` };
    }

    // 验证成功，清除验证码（如果启用单次有效）
    if (this.config.get('EMAIL_CODE_SINGLE_USE') === 'true') {
      await this.users.repo.update(user.id, {
        emailVerifyCode: undefined,
        emailVerifyCodeExpiry: undefined,
        emailVerifyFailCount: 0,
      });
    }

    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { code: CODE.SUCCESS, message: '登录成功', data: token };
  }

  // ===== 邮箱验证码功能：邮箱注册（支持用户选择角色） =====
  async emailRegister(email: string, code: string, password: string, role: string): Promise<Result> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      return { code: CODE.EMAIL_NOT_FOUND, message: '请先发送验证码' };
    }

    // 检查是否已完成注册（只有当密码哈希存在，且不等于 'pending_verification' 时，才认为是正式用户）
    if (user.passwordHash && user.passwordHash !== 'pending_verification') {
      return { code: CODE.EMAIL_ALREADY_EXISTS, message: '该邮箱已注册，请直接登录' };
    }

    // 检查锁定
    if (user.emailVerifyFailLockUntil && new Date(user.emailVerifyFailLockUntil) > new Date()) {
      const remain = Math.ceil((new Date(user.emailVerifyFailLockUntil).getTime() - Date.now()) / 60000);
      return { code: 403, message: `验证失败次数过多，请${remain}分钟后再试` };
    }

    if (!user.emailVerifyCode || !user.emailVerifyCodeExpiry) {
      return { code: CODE.EMAIL_CODE_NOT_SENT, message: '验证码不存在，请先发送验证码' };
    }

    if (new Date(user.emailVerifyCodeExpiry) < new Date()) {
      return { code: CODE.EMAIL_CODE_EXPIRED, message: '验证码已过期' };
    }

    // 校验验证码
    if (user.emailVerifyCode !== code) {
      const failCount = (user.emailVerifyFailCount || 0) + 1;
      const maxFail = parseInt(this.config.get('EMAIL_CODE_FAIL_MAX_COUNT', '5'), 10);

      if (failCount >= maxFail) {
        const lockMinutes = parseInt(this.config.get('EMAIL_CODE_FAIL_LOCK_MINUTES', '10'), 10);
        await this.users.repo.update(user.id, {
          emailVerifyFailCount: failCount,
          emailVerifyFailLockUntil: new Date(Date.now() + lockMinutes * 60 * 1000),
        });
        return { code: 403, message: `验证码错误次数过多，已锁定${lockMinutes}分钟` };
      }

      await this.users.repo.update(user.id, { emailVerifyFailCount: failCount });
      return { code: CODE.REGISTER_ERROR, message: `验证码错误，还剩${maxFail - failCount}次机会` };
    }

    // 密码校验
    if (!password || password.length < 6) {
      return { code: 400, message: '密码至少6位' };
    }

    // 角色校验：用户选择的角色
    const validRole = role === 'ADMIN' ? UserRole.ADMIN : UserRole.MERCHANT;

    // 验证成功，完成注册（将邮箱设为用户名）
    await this.users.repo.update(user.id, {
      passwordHash: await bcrypt.hash(password, 10),
      role: validRole,
      emailVerifyCode: undefined,
      emailVerifyCodeExpiry: undefined,
      emailVerifyFailCount: 0,
      username: email,
    });

    const token = await this.jwt.signAsync({ sub: user.id, role: validRole });
    return { code: CODE.SUCCESS, message: '注册成功', data: token };
  }
}