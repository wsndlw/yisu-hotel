import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/models/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: { username: string; password: string; role: UserRole }) {
    const exists = await this.users.findByUsername(input.username);
    if (exists) throw new BadRequestException('Username already exists');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.users.createUser({
      username: input.username,
      passwordHash,
      role: input.role,
    });

    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return { accessToken, user };
  }

  async login(input: { username: string; password: string }) {
    const user = await this.users.findByUsername(input.username);
    if (!user) throw new UnauthorizedException('Invalid username or password');

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid username or password');

    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return { accessToken, user };
  }
}
