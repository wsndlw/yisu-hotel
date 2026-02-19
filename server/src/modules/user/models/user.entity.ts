import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  MERCHANT = 'MERCHANT',
  ADMIN = 'ADMIN',
}

registerEnumType(UserRole, { name: 'UserRole', description: '用户角色' });

@ObjectType('User', { description: '系统用户' })
@Entity('users')
export class UserEntity {
  @Field(() => ID, { description: '用户ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { description: '用户名（唯一）' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, comment: '用户名（唯一）' })
  username: string;

  @Column({ type: 'varchar', length: 255, comment: '密码哈希（不对外暴露）' })
  passwordHash: string;

  @Field(() => UserRole, { description: '用户角色（商户/管理员）' })
  @Column({ type: 'simple-enum', enum: UserRole, default: UserRole.MERCHANT, comment: '用户角色' })
  role: UserRole;

  @Field(() => String, { nullable: true, description: '头像URL（可选）' })
  @Column({ type: 'varchar', length: 512, nullable: true, comment: '头像URL' })
  avatarUrl?: string | null;

  @Field(() => [String], { description: '商户常用标签ID（用于新建酒店默认值）', nullable: true })
  @Column({ type: 'json', nullable: true, comment: '商户常用标签ID' })
  preferredTagIds?: string[] | null;

  @Field(() => [String], { description: '商户常用设施ID（用于新建酒店默认值）', nullable: true })
  @Column({ type: 'json', nullable: true, comment: '商户常用设施ID' })
  preferredFacilityIds?: string[] | null;

  @Field(() => Date, { description: '创建时间' })
  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @Field(() => Date, { description: '更新时间' })
  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
