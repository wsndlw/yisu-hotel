import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from './models/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    public readonly repo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { username } });
  }

  async updateUser(id: string, patch: Partial<Pick<UserEntity, 'username' | 'passwordHash'>>): Promise<UserEntity> {
    await this.repo.update({ id }, patch);
    const updated = await this.findById(id);
    return updated as UserEntity;
  }



    // ===== 邮箱验证码功能：根据邮箱查找用户 =====
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  // ===== 邮箱验证码功能：支持创建带邮箱的用户 =====
  async createUser(params: { username?: string; passwordHash: string; role: UserRole; email?: string }): Promise<UserEntity> {
    const user = this.repo.create(params);
    return this.repo.save(user);
  }

  // ===== 邮箱验证码功能：更新用户验证码 =====
  async updateEmailCode(userId: string, code: string): Promise<boolean> {
    const result = await this.repo.update(userId, {
      emailVerifyCode: code,
      emailVerifyCodeExpiry: new Date(Date.now() + 5 * 60 * 1000),
      emailVerifyFailCount: 0,
    });
    return (result.affected ?? 0) > 0;
  }
}

