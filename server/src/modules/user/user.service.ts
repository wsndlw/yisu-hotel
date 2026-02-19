import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from './models/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { username } });
  }

  async createUser(params: { username: string; passwordHash: string; role: UserRole }): Promise<UserEntity> {
    const user = this.repo.create(params);
    return this.repo.save(user);
  }

  async updateUser(id: string, patch: Partial<Pick<UserEntity, 'username' | 'passwordHash'>>): Promise<UserEntity> {
    await this.repo.update({ id }, patch);
    const updated = await this.findById(id);
    return updated as UserEntity;
  }
}

