import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FacilityEntity, FacilityType, FacilityCategory } from './models/facility.entity';

@Injectable()
export class FacilityService {
  constructor(
    @InjectRepository(FacilityEntity)
    private readonly facilityRepo: Repository<FacilityEntity>,
  ) {}

  /**
   * 获取所有设施（管理员）
   */
  async getAllFacilities(): Promise<FacilityEntity[]> {
    return this.facilityRepo.find({ order: { type: 'ASC', name: 'ASC' } });
  }

  /**
   * 获取启用的设施（用户端）
   */
  async getEnabledFacilities(): Promise<FacilityEntity[]> {
    return this.facilityRepo.find({
      where: { enabled: true },
      order: { type: 'ASC', name: 'ASC' },
    });
  }

  /**
   * 按类型获取启用的设施
   */
  async getEnabledFacilitiesByType(type: FacilityType): Promise<FacilityEntity[]> {
    return this.facilityRepo.find({
      where: { enabled: true, type },
      order: { name: 'ASC' },
    });
  }

  /**
   * 根据ID列表获取设施
   */
  async getFacilitiesByIds(ids: string[]): Promise<FacilityEntity[]> {
    if (!ids || ids.length === 0) return [];
    return this.facilityRepo.findByIds(ids as any);
  }

  /**
   * 创建或更新设施
   */
  async upsertFacility(
    id: string | null,
    name: string,
    type: FacilityType,
    category?: FacilityCategory,
  ): Promise<FacilityEntity> {
    // 检查同类型下名称是否重复
    const existing = await this.facilityRepo.findOne({
      where: { name, type },
    });

    // if (existing && (!id || existing.id !== id)) {
    //   throw new BadRequestException('该类型下已存在同名设施');
    // }

    const saveData: Partial<FacilityEntity> = {
      name,
      type,
      category: category || FacilityCategory.OTHER,
    };

    if (id) {
      saveData.id = id;
      return this.facilityRepo.save(saveData as any);
    } else {
      saveData.enabled = true;
      return this.facilityRepo.save(this.facilityRepo.create(saveData));
    }
  }

  /**
   * 设置启用状态
   */
  async setEnabled(id: string, enabled: boolean): Promise<FacilityEntity> {
    return this.facilityRepo.save({ id, enabled } as any);
  }

  /**
   * 软删除（禁用）
   */
  async softDelete(id: string): Promise<FacilityEntity> {
    return this.setEnabled(id, false);
  }

  /**
   * 硬删除
   */
  async hardDelete(id: string): Promise<void> {
    // 检查是否被酒店使用（标签表）
    const tagRefCount = await this.facilityRepo
      .createQueryBuilder('f')
      .innerJoin('hotel_tags', 'ht', 'ht.tagId = f.id')
      .where('f.id = :id', { id })
      .andWhere('f.type = :type', { type: FacilityType.TAG })
      .getCount();

    if (tagRefCount > 0) {
      throw new BadRequestException(
        '该设施已被酒店使用（作为标签），无法彻底删除；可改为"禁用"',
      );
    }

    // 检查是否被酒店使用（设施表）
    const facilityRefCount = await this.facilityRepo
      .createQueryBuilder('f')
      .innerJoin('hotel_facilities', 'hf', 'hf.facilityId = f.id')
      .where('f.id = :id', { id })
      .andWhere('f.type = :type', { type: FacilityType.FACILITY })
      .getCount();

    if (facilityRefCount > 0) {
      throw new BadRequestException(
        '该设施已被酒店使用，无法彻底删除；可改为"禁用"',
      );
    }

    await this.facilityRepo.delete({ id } as any);
  }
}
