import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Like, Repository } from 'typeorm';

import { UserEntity, UserRole } from '../user/models/user.entity';
import { HotelAuditAction } from '../audit-record/models/audit-record.entity';
import { AuditService } from '../audit-record/audit.service';
import { HotelEntity, HotelStatus } from './models/hotel.entity';
import { HotelImageEntity } from '../hotelImage/models/hotel-image.entity';
import { RoomTypeEntity } from '../roomType/models/room-type.entity';
import { HotelListResult } from './dto/hotel.type';
import { HotelUpsertInput } from './dto/hotel.input';
import { FacilityEntity, FacilityType } from '../facility/models/facility.entity';
import { FacilityService } from '../facility/facility.service';
import { migrateCityData } from '../../shared/utils/city';

@Injectable()
export class HotelService {
  constructor(
    @InjectRepository(HotelEntity)
    private readonly hotelRepo: Repository<HotelEntity>,
    @InjectRepository(RoomTypeEntity)
    private readonly roomRepo: Repository<RoomTypeEntity>,
    @InjectRepository(HotelImageEntity)
    private readonly imageRepo: Repository<HotelImageEntity>,
    private readonly facilityService: FacilityService, // 使用 FacilityService 替代直接注入 Repository
    @Inject(forwardRef(() => AuditService))
    private readonly auditService: AuditService,
  ) { }

  private assertMerchant(user: UserEntity) {
    if (user.role !== UserRole.MERCHANT) throw new ForbiddenException('仅商户可操作');
  }

  async assertMerchantHotel(hotelId: string, merchant: UserEntity) {
    this.assertMerchant(merchant);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('酒店不存在');
    if (hotel.merchantId !== merchant.id) throw new ForbiddenException('不是你的酒店');
    return hotel;
  }

  async getHotelDetail(id: string) {
    return this.getHotelById(id);
  }

  async updateStatus(id: string, status: HotelStatus) {
    await this.hotelRepo.update({ id }, { status });
  }

  private assertAdmin(user: UserEntity) {
    if (user.role !== UserRole.ADMIN) throw new ForbiddenException('仅管理员可操作');
  }

  async getHotelById(id: string): Promise<HotelEntity> {
    const hotel = await this.hotelRepo.findOne({
      where: { id },
      relations: ['roomTypes', 'images', 'tags', 'facilities', 'merchant'],
    });
    if (!hotel) throw new NotFoundException('酒店不存在');

    hotel.roomTypes = (hotel.roomTypes || []).slice().sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    hotel.images = (hotel.images || []).slice().sort((a, b) => a.sortOrder - b.sortOrder);
    hotel.tags = (hotel.tags || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));
    hotel.facilities = (hotel.facilities || []).slice().sort((a, b) => a.name.localeCompare(b.name, 'zh'));

    return hotel;
  }

  async listHotels(input: {
    city?: string;
    keyword?: string;
    merchantKeyword?: string;
    starLevel?: number;
    tagIds?: string[];
    facilityIds?: string[];
    status?: HotelStatus;
    page: number;
    pageSize: number;
  }): Promise<HotelListResult> {
    const page = Math.max(1, input.page || 1);
    const pageSize = Math.min(50, Math.max(1, input.pageSize || 10));

    const hasJoinFilter = (input.tagIds && input.tagIds.length > 0) || (input.facilityIds && input.facilityIds.length > 0);

    if (hasJoinFilter || input.merchantKeyword || input.keyword) {
      const qb = this.hotelRepo
        .createQueryBuilder('hotel')
        .leftJoinAndSelect('hotel.tags', 'tag')
        .leftJoinAndSelect('hotel.facilities', 'facility')
        .leftJoinAndSelect('hotel.merchant', 'merchant')
        .orderBy('hotel.updatedAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize);

      if (input.city) qb.andWhere('hotel.city = :city', { city: input.city });
      if (typeof input.starLevel === 'number') qb.andWhere('hotel.starLevel = :starLevel', { starLevel: input.starLevel });
      if (input.status) {
        qb.andWhere('hotel.status = :status', { status: input.status });
      } else {
        qb.andWhere('hotel.status != :draft', { draft: HotelStatus.DRAFT });
      }

      const keyword = input.keyword?.trim();
      if (keyword) {
        qb.andWhere(
          '(hotel.nameZh LIKE :kw OR hotel.nameEn LIKE :kw OR hotel.address LIKE :kw)',
          { kw: `%${keyword}%` },
        );
      }

      const mkw = input.merchantKeyword?.trim();
      if (mkw) {
        qb.andWhere('merchant.username LIKE :mkw', { mkw: `%${mkw}%` });
      }

      if (input.tagIds && input.tagIds.length > 0) {
        qb.andWhere('tag.id IN (:...tagIds)', { tagIds: input.tagIds });
      }

      if (input.facilityIds && input.facilityIds.length > 0) {
        qb.andWhere('facility.id IN (:...facilityIds)', { facilityIds: input.facilityIds });
      }

      const [list, total] = await qb.getManyAndCount();
      return { list, total, page, pageSize };
    }

    const baseWhere: FindOptionsWhere<HotelEntity> = {};
    if (input.city) baseWhere.city = input.city;
    if (typeof input.starLevel === 'number') baseWhere.starLevel = input.starLevel;
    if (input.status) {
      baseWhere.status = input.status;
    } else {
      baseWhere.status = In([HotelStatus.REVIEWING, HotelStatus.REJECTED, HotelStatus.PUBLISHED, HotelStatus.OFFLINE]);
    }

    const keyword = input.keyword?.trim();
    const keywordWheres: FindOptionsWhere<HotelEntity>[] = keyword
      ? [
        { ...baseWhere, nameZh: Like(`%${keyword}%`) },
        { ...baseWhere, nameEn: Like(`%${keyword}%`) },
        { ...baseWhere, address: Like(`%${keyword}%`) },
      ]
      : [{ ...baseWhere }];

    const [list, total] = await this.hotelRepo.findAndCount({
      where: keywordWheres,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { updatedAt: 'DESC' },
      relations: ['tags', 'facilities', 'merchant'],
    });

    return { list, total, page, pageSize };
  }

  async myHotels(user: UserEntity, status?: HotelStatus): Promise<HotelEntity[]> {
    if (user.role === UserRole.ADMIN) {
      return this.hotelRepo.find({
        where: status ? { status } : {},
        order: { updatedAt: 'DESC' },
        relations: ['tags', 'facilities'],
      });
    }

    return this.hotelRepo.find({
      where: status ? { merchantId: user.id, status } : { merchantId: user.id },
      order: { updatedAt: 'DESC' },
      relations: ['tags', 'facilities'],
    });
  }

  /**
   * 解析标签（从设施表中筛选 TAG 类型）
   */
  private async resolveTags(tagIds: string[]): Promise<FacilityEntity[]> {
    if (!tagIds || tagIds.length === 0) return [];
    const facilities = await this.facilityService.getFacilitiesByIds(tagIds);
    const tags = facilities.filter(f => f.enabled && f.type === FacilityType.TAG);
    if (tags.length !== tagIds.length) {
      throw new BadRequestException('存在无效标签，请刷新后重新选择');
    }
    return tags;
  }

  /**
   * 解析设施（从设施表中筛选 FACILITY 类型）
   */
  private async resolveFacilities(facilityIds?: string[]): Promise<FacilityEntity[]> {
    if (!facilityIds || facilityIds.length === 0) return [];
    const facilities = await this.facilityService.getFacilitiesByIds(facilityIds);
    const validFacilities = facilities.filter(f => f.enabled && f.type === FacilityType.FACILITY);
    if (validFacilities.length !== facilityIds.length) {
      throw new BadRequestException('存在无效设施，请刷新后重新选择');
    }
    return validFacilities;
  }

  // Merchant operations
  private generateHotelNo(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `HT${yy}${mm}${dd}${hh}${mi}${rand}`;
  }

  async createHotel(merchant: UserEntity, input: any): Promise<HotelEntity> {
    this.assertMerchant(merchant);

    // ===============================
    // 【严格校验】根据提交类型进行分组校验
    // ===============================
    const inputInstance = plainToInstance(HotelUpsertInput, input);
    const validateGroup = input.isSubmit ? ['SUBMIT'] : ['DRAFT'];
    await validateOrReject(inputInstance, { groups: validateGroup, forbidUnknownValues: false });

    const tags = await this.resolveTags(input.tagIds || []);
    const facilities = await this.resolveFacilities(input.facilityIds || []);

    // 城市数据迁移：将城市名称转换为城市编码
    const cityCode = migrateCityData(input.city);

    const entity = this.hotelRepo.create({
      nameZh: input.nameZh,
      nameEn: input.nameEn ?? null,
      address: input.address,
      latitude: typeof input.latitude === 'number' ? input.latitude : null,
      longitude: typeof input.longitude === 'number' ? input.longitude : null,
      city: cityCode,
      starLevel: input.starLevel,
      openSince: input.openSince || null,
      tags,
      facilities,
      nearby: input.nearby ?? null,
      discountInfo: input.discountInfo ?? null,
      status: input.isSubmit ? HotelStatus.REVIEWING : HotelStatus.DRAFT,
      rejectReason: null,
      merchantId: merchant.id,
      miniPrice: 0,
      favoriteCount: Math.floor(Math.random() * 9999), // 随机生成 0-9998 的收藏数
      score: Math.round((Math.random() * 5) * 10) / 10, // 随机生成 0-5 分，保留一位小数
      hotelID: this.generateHotelNo(),
    });

    const saved = await this.hotelRepo.save(entity);

    if (input.isSubmit) {
      await this.auditService.addRecord({
        hotelId: saved.id,
        action: HotelAuditAction.SUBMIT,
        operatorId: merchant.id,
      });
    }

    return saved;
  }

  async updateHotel(merchant: UserEntity, hotelId: string, input: any): Promise<HotelEntity> {
    this.assertMerchant(merchant);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId }, relations: ['tags', 'facilities'] });
    if (!hotel) throw new NotFoundException('酒店不存在');
    if (hotel.merchantId !== merchant.id) throw new ForbiddenException('不是你的酒店');

    if (![HotelStatus.DRAFT, HotelStatus.REJECTED, HotelStatus.PUBLISHED].includes(hotel.status)) {
      throw new BadRequestException('当前状态不可编辑');
    }

    // ===============================
    // 【严格校验】根据提交类型进行分组校验
    // ===============================
    const inputInstance = plainToInstance(HotelUpsertInput, input);
    const validateGroup = input.isSubmit ? ['SUBMIT'] : ['DRAFT'];
    await validateOrReject(inputInstance, { groups: validateGroup, forbidUnknownValues: false });

    const tags = input.tagIds ? await this.resolveTags(input.tagIds) : hotel.tags || [];
    const facilities = input.facilityIds ? await this.resolveFacilities(input.facilityIds) : hotel.facilities || [];

    // 城市数据迁移：将城市名称转换为城市编码
    const cityCode = migrateCityData(input.city);

    Object.assign(hotel, {
      nameZh: input.nameZh,
      nameEn: input.nameEn ?? null,
      address: input.address,
      latitude: typeof input.latitude === 'number' ? input.latitude : null,
      longitude: typeof input.longitude === 'number' ? input.longitude : null,
      city: cityCode,
      starLevel: input.starLevel,
      openSince: input.openSince || null,
      tags,
      facilities,
      nearby: input.nearby ?? null,
      discountInfo: input.discountInfo ?? null,
    });

    // 提交审核：状态改为 REVIEWING
    if (input.isSubmit) {
      if (![HotelStatus.DRAFT, HotelStatus.REJECTED, HotelStatus.OFFLINE].includes(hotel.status)) {
        throw new BadRequestException('仅草稿/未通过/已下线状态可提交审核');
      }
      hotel.status = HotelStatus.REVIEWING;
      hotel.rejectReason = null;
      // 如果收藏数为0（旧数据），则生成一个随机值
      if (!hotel.favoriteCount) {
        hotel.favoriteCount = Math.floor(Math.random() * 9999);
      }
      await this.auditService.addRecord({
        hotelId: hotel.id,
        action: HotelAuditAction.SUBMIT,
        operatorId: merchant.id,
      });
    } else if (hotel.status !== HotelStatus.PUBLISHED) {
      // 保存草稿（已发布酒店不允许回退为草稿）
      hotel.status = HotelStatus.DRAFT;
    }

    return this.hotelRepo.save(hotel);
  }

  async deleteHotel(merchant: UserEntity, hotelId: string): Promise<HotelEntity> {
    this.assertMerchant(merchant);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('酒店不存在');
    if (hotel.merchantId !== merchant.id) throw new ForbiddenException('不是你的酒店');

    if (![HotelStatus.DRAFT, HotelStatus.REJECTED].includes(hotel.status)) {
      throw new BadRequestException('仅草稿/未通过状态可删除');
    }

    // 删除关联数据
    await this.imageRepo.delete({ hotelId });
    await this.roomRepo.delete({ hotelId });
    await this.auditService.deleteByHotelId(hotelId);

    await this.hotelRepo.delete({ id: hotelId });

    return hotel;
  }

  async withdrawHotel(merchant: UserEntity, hotelId: string): Promise<HotelEntity> {
    this.assertMerchant(merchant);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('酒店不存在');
    if (hotel.merchantId !== merchant.id) throw new ForbiddenException('不是你的酒店');
    if (hotel.status !== HotelStatus.REVIEWING) throw new BadRequestException('仅审核中可撤回');

    hotel.status = HotelStatus.DRAFT;
    await this.auditService.addRecord({
      hotelId: hotel.id,
      action: HotelAuditAction.WITHDRAW,
      operatorId: merchant.id,
    });

    return this.hotelRepo.save(hotel);
  }

  async requestOffline(merchant: UserEntity, hotelId: string): Promise<HotelEntity> {
    this.assertMerchant(merchant);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('酒店不存在');
    if (hotel.merchantId !== merchant.id) throw new ForbiddenException('不是你的酒店');
    if (hotel.status !== HotelStatus.PUBLISHED) throw new BadRequestException('仅已发布可下线申请');

    hotel.status = HotelStatus.OFFLINE;
    await this.auditService.addRecord({
      hotelId: hotel.id,
      action: HotelAuditAction.OFFLINE_REQUEST,
      operatorId: merchant.id,
    });

    return this.hotelRepo.save(hotel);
  }

  async submitForReview(merchant: UserEntity, hotelId: string): Promise<HotelEntity> {
    this.assertMerchant(merchant);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('酒店不存在');
    if (hotel.merchantId !== merchant.id) throw new ForbiddenException('不是你的酒店');

    if (![HotelStatus.DRAFT, HotelStatus.REJECTED, HotelStatus.OFFLINE].includes(hotel.status)) {
      throw new BadRequestException('仅草稿/未通过/已下线状态可提交');
    }

    hotel.status = HotelStatus.REVIEWING;
    hotel.rejectReason = null;

    await this.auditService.addRecord({
      hotelId: hotel.id,
      action: HotelAuditAction.SUBMIT,
      operatorId: merchant.id,
    });

    return this.hotelRepo.save(hotel);
  }

  async setImages(merchant: UserEntity, hotelId: string, urls: string[]): Promise<HotelEntity> {
    this.assertMerchant(merchant);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('酒店不存在');
    if (hotel.merchantId !== merchant.id) throw new ForbiddenException('不是你的酒店');

    await this.imageRepo.delete({ hotelId });
    const imgs = urls.map((url, idx) => this.imageRepo.create({ hotelId, url, sortOrder: idx }));
    await this.imageRepo.save(imgs);

    return this.getHotelById(hotelId);
  }

  private async recalcMiniPrice(hotelId: string) {
    const rooms = await this.roomRepo.find({ where: { hotelId } });
    const mini = rooms.length ? Math.min(...rooms.map((r) => Number(r.basePrice))) : 0;
    await this.hotelRepo.update({ id: hotelId }, { miniPrice: mini });
  }

  async refreshMiniPrice(hotelId: string) {
    await this.recalcMiniPrice(hotelId);
    const updatedHotel = await this.getHotelById(hotelId);
    return updatedHotel;
  }

  // moved to RoomTypeService

  // Admin operations
  async approveHotel(admin: UserEntity, hotelId: string) {
    this.assertAdmin(admin);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('酒店不存在');
    if (hotel.status !== HotelStatus.REVIEWING) throw new BadRequestException('酒店不在审核中');

    await this.auditService.addRecord({
      hotelId: hotel.id,
      action: HotelAuditAction.APPROVE,
      operatorId: admin.id,
    });

    return this.getHotelById(hotelId);
  }

  async rejectHotel(admin: UserEntity, hotelId: string, reason: string) {
    this.assertAdmin(admin);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('酒店不存在');
    if (hotel.status !== HotelStatus.REVIEWING) throw new BadRequestException('酒店不在审核中');

    hotel.status = HotelStatus.REJECTED;
    hotel.rejectReason = reason;

    await this.auditService.addRecord({
      hotelId: hotel.id,
      action: HotelAuditAction.REJECT,
      operatorId: admin.id,
      reason,
    });

    await this.hotelRepo.save(hotel);
    return this.getHotelById(hotelId);
  }

  async publishHotel(admin: UserEntity, hotelId: string) {
    this.assertAdmin(admin);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('酒店不存在');

    if (hotel.status !== HotelStatus.REVIEWING && hotel.status !== HotelStatus.OFFLINE) {
      throw new BadRequestException('仅审核中/已下线可发布');
    }

    hotel.status = HotelStatus.PUBLISHED;
    await this.auditService.addRecord({
      hotelId: hotel.id,
      action: HotelAuditAction.PUBLISH,
      operatorId: admin.id,
    });

    await this.hotelRepo.save(hotel);
    return this.getHotelById(hotelId);
  }

  async offlineHotel(admin: UserEntity, hotelId: string) {
    this.assertAdmin(admin);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('酒店不存在');
    if (hotel.status !== HotelStatus.PUBLISHED) throw new BadRequestException('仅已发布可下线');

    hotel.status = HotelStatus.OFFLINE;
    await this.auditService.addRecord({
      hotelId: hotel.id,
      action: HotelAuditAction.OFFLINE,
      operatorId: admin.id,
    });

    await this.hotelRepo.save(hotel);
    return this.getHotelById(hotelId);
  }

  async restoreHotel(admin: UserEntity, hotelId: string) {
    this.assertAdmin(admin);
    const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
    if (!hotel) throw new NotFoundException('酒店不存在');
    if (hotel.status !== HotelStatus.OFFLINE) throw new BadRequestException('仅已下线可恢复');

    hotel.status = HotelStatus.PUBLISHED;
    await this.auditService.addRecord({
      hotelId: hotel.id,
      action: HotelAuditAction.RESTORE,
      operatorId: admin.id,
    });

    await this.hotelRepo.save(hotel);
    return this.getHotelById(hotelId);
  }

  /**
   * 【移动端专用】获取酒店列表 - 支持多维度筛选和距离计算
   */
  async listHotelsForH5(input: any): Promise<any> {
    const page = Math.max(1, input.page || 1);
    const pageSize = Math.min(50, Math.max(1, input.pageSize || 10));

    const qb = this.hotelRepo
      .createQueryBuilder('hotel')
      .leftJoinAndSelect('hotel.tags', 'tag')
      .leftJoinAndSelect('hotel.facilities', 'facility')
      .leftJoinAndSelect('hotel.roomTypes', 'roomType')
      .leftJoinAndSelect('hotel.images', 'image')
      .where('hotel.status = :status', { status: HotelStatus.PUBLISHED });

    const hasGeo = input.latitude != null && input.longitude != null;
    if (hasGeo) {
      qb.addSelect(
        'ST_Distance_Sphere(POINT(:lng, :lat), POINT(hotel.longitude, hotel.latitude))',
        'distance',
      ).setParameters({ lng: input.longitude, lat: input.latitude });
    }

    // 城市筛选
    if (input.city) {
      qb.andWhere('hotel.city = :city', { city: input.city });
    }

    // 关键词搜索
    if (input.keyword) {
      qb.andWhere('(hotel.nameZh LIKE :kw OR hotel.nameEn LIKE :kw OR hotel.address LIKE :kw)', {
        kw: `%${input.keyword}%`,
      });
    }

    // 星级筛选
    if (typeof input.starLevel === 'number') {
      qb.andWhere('hotel.starLevel = :starLevel', { starLevel: input.starLevel });
    }

    // 价格区间筛选
    if (typeof input.minPrice === 'number') {
      qb.andWhere('hotel.miniPrice >= :minPrice', { minPrice: input.minPrice });
    }
    if (typeof input.maxPrice === 'number') {
      qb.andWhere('hotel.miniPrice <= :maxPrice', { maxPrice: input.maxPrice });
    }

    // 标签筛选
    if (input.tagIds && input.tagIds.length > 0) {
      qb.andWhere('tag.id IN (:...tagIds)', { tagIds: input.tagIds });
    }

    // 设施筛选
    if (input.facilityIds && input.facilityIds.length > 0) {
      qb.andWhere('facility.id IN (:...facilityIds)', { facilityIds: input.facilityIds });
    }

    // 排序
    const sortBy = input.sortBy || 'updatedAt';
    if (sortBy === 'price') {
      qb.orderBy('hotel.miniPrice', 'ASC');
    } else if (sortBy === 'starLevel') {
      qb.orderBy('hotel.starLevel', 'DESC');
    } else if (sortBy === 'distance' && hasGeo) {
      qb.orderBy('distance', 'ASC');
    } else {
      qb.orderBy('hotel.updatedAt', 'DESC');
    }

    qb.skip((page - 1) * pageSize).take(pageSize);

    if (hasGeo && typeof input.distanceMax === 'number') {
      qb.andWhere(
        'ST_Distance_Sphere(POINT(:lng, :lat), POINT(hotel.longitude, hotel.latitude)) <= :maxDistance',
        { maxDistance: input.distanceMax * 1000 },
      );
    }

    const { entities, raw } = await qb.getRawAndEntities();
    const total = await qb.getCount();

    const listWithDistance = entities.map((hotel) => {
      let distance;
      let distanceText;

      if (
        input.latitude &&
        input.longitude &&
        hotel.latitude != null &&
        hotel.longitude != null
      ) {
        // 【优先使用数据库计算的距离】
        // 数据库返回的 distance 单位是米
        // 注意：getRawAndEntities 会把 raw 结果放在 raw 数组中，需要匹配 id
        const rawData = raw.find((r) => r.hotel_id === hotel.id);
        if (rawData && rawData.distance) {
          distance = Math.round(Number(rawData.distance));
        } else {
          // 降级方案：如果数据库没返回，再使用 JS 计算
          const distKm = this.calculateDistance(
            input.latitude,
            input.longitude,
            hotel.latitude,
            hotel.longitude,
          );
          distance = Math.round(distKm * 1000);
        }

        /*
        // 旧的 JS 计算逻辑（已注释，供参考）
        const distKm = this.calculateDistance(
          input.latitude,
          input.longitude,
          hotel.latitude,
          hotel.longitude,
        );
        distance = Math.round(distKm * 1000);
        */

        // 生成文案
        if (distance < 1000) {
          // 小于1000米：精确到10米（如 358 -> 360）
          const tens = Math.round(distance / 10) * 10;
          distanceText = `${tens}m`;
        } else {
          // 大于1000米：保留1位小数（如 1.2km）
          distanceText = `${(distance / 1000).toFixed(1)}km`;
        }
      }

      if (hotel.roomTypes) {
        hotel.roomTypes = hotel.roomTypes
          .slice()
          .sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
      }
      if (hotel.images) {
        hotel.images = hotel.images.slice().sort((a, b) => a.sortOrder - b.sortOrder);
      }

      return { ...hotel, distance, distanceText };
    });

    return { list: listWithDistance, total, page, pageSize };
  }

  /**
   * 【移动端专用】获取酒店详情
   */
  async getHotelForH5(
    id: string,
    latitude?: number,
    longitude?: number,
  ): Promise<any> {
    // 1. 复用 getHotelById 获取完整的酒店详情（包含所有关联表和排序逻辑）
    const hotel = await this.getHotelById(id);

    // 只返回已发布的酒店
    if (hotel.status !== HotelStatus.PUBLISHED) {
      throw new NotFoundException('酒店不存在或未发布');
    }

    // 2. 计算距离
    let distance;
    let distanceText;

    if (
      latitude != null &&
      longitude != null &&
      hotel.latitude != null &&
      hotel.longitude != null
    ) {
      // 【优先使用数据库计算的距离】
      // 单独查询一次数据库计算距离，避免重复手写复杂的 QueryBuilder
      const result = await this.hotelRepo
        .createQueryBuilder('hotel')
        .select(
          'ST_Distance_Sphere(POINT(:lng, :lat), POINT(hotel.longitude, hotel.latitude))',
          'distance',
        )
        .where('hotel.id = :id', { id })
        .setParameters({ lng: longitude, lat: latitude })
        .getRawOne();

      if (result && result.distance) {
        distance = Math.round(Number(result.distance));
      } else {
        // 降级方案
        const distKm = this.calculateDistance(
          latitude,
          longitude,
          hotel.latitude,
          hotel.longitude,
        );
        distance = Math.round(distKm * 1000);
      }

      // 生成文案
      if (distance < 1000) {
        // 小于1000米：精确到10米
        const tens = Math.round(distance / 10) * 10;
        distanceText = `${tens}m`;
      } else {
        // 大于1000米：保留1位小数
        distanceText = `${(distance / 1000).toFixed(1)}km`;
      }
    }

    return { ...hotel, distance, distanceText };
  }

  /**
   * 【移动端专用】获取推荐酒店
   */
  async getRecommendHotels(
    latitude: number,
    longitude: number,
    limit = 10,
  ): Promise<any[]> {
    const hotels = await this.hotelRepo.find({
      where: { status: HotelStatus.PUBLISHED },
      take: 100, // 先取100个，计算距离后再筛选
      relations: ['tags', 'facilities', 'images'],
    });

    // 计算距离并排序
    const hotelsWithDistance = hotels
      .map((hotel) => {
        let distance;
        let distanceText;
        if (hotel.latitude != null && hotel.longitude != null) {
          const distKm = this.calculateDistance(
            latitude,
            longitude,
            hotel.latitude,
            hotel.longitude,
          );

          // 转换为米（取整）
          distance = Math.round(distKm * 1000);

          // 生成文案
          if (distance < 1000) {
            // 小于1000米：精确到10米
            const tens = Math.round(distance / 10) * 10;
            distanceText = `${tens}m`;
          } else {
            // 大于1000米：保留1位小数
            distanceText = `${distKm.toFixed(1)}km`;
          }
        }
        return { ...hotel, distance, distanceText };
      })
      .filter((h) => h.distance != null)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);

    return hotelsWithDistance;
  }

  /**
   * 【移动端专用】获取热门城市
   */
  async getHotCities(): Promise<any[]> {
    const result = await this.hotelRepo
      .createQueryBuilder('hotel')
      .select('hotel.city', 'cityCode')
      .addSelect('COUNT(hotel.id)', 'hotelCount')
      .where('hotel.status = :status', { status: HotelStatus.PUBLISHED })
      .groupBy('hotel.city')
      .orderBy('hotelCount', 'DESC')
      .limit(20)
      .getRawMany();

    return result.map((item) => ({
      cityCode: item.cityCode,
      cityName: this.getCityName(item.cityCode),
      hotelCount: parseInt(item.hotelCount, 10),
    }));
  }

  /**
   * 计算两点之间的距离（单位：公里）
   * 使用 Haversine 公式
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // 地球半径（公里）
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance; // 返回精确的公里数，不做舍入，以便后续精确计算
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * 根据城市编码获取城市名称
   */
  private getCityName(cityCode: string): string {
    const { getCityByCode } = require('../../common/constants/city');
    const city = getCityByCode(cityCode);
    return city ? city.name : cityCode;
  }

}
