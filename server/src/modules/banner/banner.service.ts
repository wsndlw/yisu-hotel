import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BannerEntity } from './models/banner.entity';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(BannerEntity)
    private readonly repo: Repository<BannerEntity>,
  ) {}

  /**
   * 移动端 Banner：只返回启用的数据（时间窗口筛选在 resolver 中处理）
   */
  async banners(): Promise<BannerEntity[]> {
    return this.repo.find({
      where: { enabled: true },
      order: { sort: 'ASC', updatedAt: 'DESC' },
    });
  }

  /**
   * 管理端 Banner：返回全部（含禁用），按 sort 升序
   */
  async allBanners(): Promise<BannerEntity[]> {
    return this.repo.find({ order: { sort: 'ASC', updatedAt: 'DESC' } });
  }

  async upsert(id: string | null, input: any): Promise<BannerEntity> {
    if (id) {
      const banner = await this.repo.findOne({ where: { id } });
      if (!banner) throw new NotFoundException('Banner not found');
      Object.assign(banner, {
        title: input.title,
        imageUrl: input.imageUrl,
        targetHotelId: input.targetHotelId,
        sort: Number(input.sort ?? 0),
        enabled: input.enabled,
        startAt: input.startAt ? new Date(input.startAt) : null,
        endAt: input.endAt ? new Date(input.endAt) : null,
      });
      return this.repo.save(banner);
    }

    const banner = this.repo.create({
      title: input.title,
      imageUrl: input.imageUrl,
      targetHotelId: input.targetHotelId,
      sort: Number(input.sort ?? 0),
      enabled: input.enabled,
      startAt: input.startAt ? new Date(input.startAt) : null,
      endAt: input.endAt ? new Date(input.endAt) : null,
    });
    return this.repo.save(banner);
  }

  async setEnabled(id: string, enabled: boolean): Promise<BannerEntity> {
    const banner = await this.repo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    banner.enabled = enabled;
    return this.repo.save(banner);
  }

  async remove(id: string): Promise<boolean> {
    const banner = await this.repo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    await this.repo.remove(banner);
    return true;
  }
}
