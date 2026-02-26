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
import { getCityByCode } from '../../common/constants/city';

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

    // ================= 分支 A：复杂查询 =================
    if (hasJoinFilter || input.merchantKeyword || input.keyword) {
      const qb = this.hotelRepo
        .createQueryBuilder('hotel')
        // 1. 用于查出全量关联数据（原封不动）
        .leftJoinAndSelect('hotel.tags', 'tag')
        .leftJoinAndSelect('hotel.facilities', 'facility')
        .leftJoinAndSelect('hotel.merchant', 'merchant')
        // 2. 【修复分页排序】加入二级排序 id
        .orderBy('hotel.updatedAt', 'DESC')
        .addOrderBy('hotel.id', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize);

      if (input.city) qb.andWhere('hotel.city = :city', { city: input.city });
      if (typeof input.starLevel === 'number') qb.andWhere('hotel.starLevel = :starLevel', { starLevel: input.starLevel });
      if (input.status !== undefined && input.status !== null) {
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

      // 3. 【修复数据截断】创建独立的 InnerJoin 用于条件过滤，不污染 Select 结果
      if (input.tagIds && input.tagIds.length > 0) {
        qb.innerJoin('hotel.tags', 'filterTag', 'filterTag.id IN (:...tagIds)', { tagIds: input.tagIds });
      }

      if (input.facilityIds && input.facilityIds.length > 0) {
        qb.innerJoin('hotel.facilities', 'filterFacility', 'filterFacility.id IN (:...facilityIds)', { facilityIds: input.facilityIds });
      }

      const [list, total] = await qb.getManyAndCount();
      return { list, total, page, pageSize };
    }

    // ================= 分支 B：简单查询 =================
    // 【修复死代码】清理了永远执行不到的 keyword 逻辑
    const baseWhere: FindOptionsWhere<HotelEntity> = {};
    if (input.city) baseWhere.city = input.city;
    if (typeof input.starLevel === 'number') baseWhere.starLevel = input.starLevel;

    if (input.status !== undefined && input.status !== null) {
      baseWhere.status = input.status;
    } else {
      // 如果使用 TypeORM 0.3+，In 需要从 typeorm 导入
      baseWhere.status = In([HotelStatus.REVIEWING, HotelStatus.REJECTED, HotelStatus.PUBLISHED, HotelStatus.OFFLINE]);
    }

    const [list, total] = await this.hotelRepo.findAndCount({
      where: baseWhere,
      skip: (page - 1) * pageSize,
      take: pageSize,
      // 2. 【修复分页排序】加入二级排序 id
      order: {
        updatedAt: 'DESC',
        id: 'DESC'
      },
      relations: ['tags', 'facilities', 'merchant'],
    });

    return { list, total, page, pageSize };
  }


  async myHotels(
    user: UserEntity,
    status?: HotelStatus,
    page = 1,
    pageSize = 10
  ): Promise<HotelListResult> {
    // 1. 【修复】防止 page 为 0 或负数导致 SQL 报错
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);

    // 2. 构建查询条件
    const where: FindOptionsWhere<HotelEntity> = {};

    if (status !== undefined && status !== null) {
      where.status = status;
    }

    if (user.role !== UserRole.ADMIN) {
      where.merchantId = user.id;
    }

    const [list, total] = await this.hotelRepo.findAndCount({
      where,
      order: {
        updatedAt: 'DESC',
        id: 'DESC'
      },
      relations: ['tags', 'facilities'],
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    });

    return {
      list,
      total,
      page: safePage,
      pageSize: safePageSize
    };
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

  // 商户操作
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


    //根据提交类型进行分组校验
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

    // 根据提交类型进行分组校验
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
      // 保存草稿
      hotel.status = HotelStatus.DRAFT;
    } else {
      // 无论是草稿还是已发布，只要不是提交审核，修改后一律变为草稿
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

    if (hotel.status === HotelStatus.DRAFT && hotel.hasEverPublished) {
      throw new BadRequestException('已发布过的酒店草稿不允许删除');
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

    // if (![HotelStatus.DRAFT, HotelStatus.REJECTED, HotelStatus.OFFLINE,HotelStatus.PUBLISHED].includes(hotel.status)) {
    //   throw new BadRequestException('仅草稿/未通过/已下线状态可提交');
    // }

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


  // 管理员操作
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
    hotel.hasEverPublished = true;
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


  async listHotelsForH5(input: any): Promise<any> {
    const page = Math.max(1, Number(input.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(input.pageSize) || 10));

    const qb = this.hotelRepo.createQueryBuilder('hotel')
      .where('hotel.status = :status', { status: HotelStatus.PUBLISHED });

    // ================= 1. 位置与标量条件筛选 (双坐标) =================
    const userLat = input.latitude;
    const userLng = input.longitude;
    const poiLat = input.filterLatitude;
    const poiLng = input.filterLongitude;

    // 显示与排序基准点：优先用户位置，降级为 POI 位置
    const displayLat = userLat != null ? userLat : poiLat;
    const displayLng = userLng != null ? userLng : poiLng;
    const hasDisplayGeo = displayLat != null && displayLng != null;

    // 过滤范围中心点：优先 POI 位置，降级为用户位置
    const filterLat = poiLat != null ? poiLat : userLat;
    const filterLng = poiLng != null ? poiLng : userLng;
    const hasFilterGeo = filterLat != null && filterLng != null;

    // 1. 计算距离并作为列返回（无论使用用户位置还是POI位置，只要有坐标就算）
    if (hasDisplayGeo) {
      qb.addSelect(
        'ST_Distance_Sphere(POINT(:dispLng, :dispLat), POINT(hotel.longitude, hotel.latitude))',
        'distance'
      ).setParameters({ dispLng: displayLng, dispLat: displayLat });
    }

    // 2. 根据范围圈定距离（使用 filterGeo 中心点）
    if (input.distanceMax != null && input.distanceMax !== '' && hasFilterGeo) {
      qb.andWhere(
        'ST_Distance_Sphere(POINT(:filterLng, :filterLat), POINT(hotel.longitude, hotel.latitude)) <= :maxDistance',
        { maxDistance: Number(input.distanceMax) * 1000, filterLng, filterLat }
      );
    }

    if (input.city) qb.andWhere('hotel.city = :city', { city: input.city });

    if (input.keyword) {
      qb.andWhere('(hotel.nameZh LIKE :kw OR hotel.nameEn LIKE :kw OR hotel.address LIKE :kw)', {
        kw: `%${input.keyword}%`,
      });
    }

    if (input.starLevel != null && input.starLevel !== '') {
      qb.andWhere('hotel.starLevel = :starLevel', { starLevel: Number(input.starLevel) });
    }
    if (input.minPrice != null && input.minPrice !== '') {
      qb.andWhere('hotel.miniPrice >= :minPrice', { minPrice: Number(input.minPrice) });
    }
    if (input.maxPrice != null && input.maxPrice !== '') {
      qb.andWhere('hotel.miniPrice <= :maxPrice', { maxPrice: Number(input.maxPrice) });
    }

    // ================= 2. 关联设施筛选 =================
    if (Array.isArray(input.facilityIds) && input.facilityIds.length > 0) {
      input.facilityIds.forEach((facilityId: string, index: number) => {
        const alias = `facility_${index}`;
        // 为每一个选中的设施，单独加一次强制内连接。缺任何一个都会被过滤掉。
        qb.innerJoin(
          'hotel.facilities',
          alias,
          `${alias}.id = :facId_${index}`,
          { [`facId_${index}`]: facilityId }
        );
      });
    }

    // ================= 3. 房型、人数与库存强绑定筛选 =================
    const hasGuestCount = input.guestCount != null && input.guestCount !== '';
    const hasRoomFilters = input.bedType || hasGuestCount || (input.checkIn && input.checkOut);

    if (hasRoomFilters) {
      qb.innerJoin('hotel.roomTypes', 'roomType');

      if (input.bedType) {
        qb.andWhere('roomType.bedType = :bedType', { bedType: input.bedType });
      }

      if (hasGuestCount) {
        qb.andWhere('roomType.maxGuests >= :guestCount', { guestCount: Number(input.guestCount) });
      }

      if (input.checkIn && input.checkOut) {
        const nights: string[] = [];
        const d = new Date(`${input.checkIn}T00:00:00.000Z`);
        const endD = new Date(`${input.checkOut}T00:00:00.000Z`);
        while (d < endD) {
          nights.push(d.toISOString().split('T')[0]);
          d.setUTCDate(d.getUTCDate() + 1);
        }

        if (nights.length > 0) {
          qb.andWhere(`
            NOT EXISTS (
              SELECT 1 FROM stock s 
              WHERE s.room_type_id = roomType.id 
              AND s.date IN (:...dates) 
              AND s.stock <= 0
            )
            AND (
              (roomType.stock > 0 OR roomType.stock IS NULL)
              OR 
              (
                (SELECT COUNT(1) FROM stock s 
                 WHERE s.room_type_id = roomType.id 
                 AND s.date IN (:...dates) 
                 AND s.stock > 0) = :nightsCount
              )
            )
          `, { dates: nights, nightsCount: nights.length });
        }
      }
    }

    // ================= 4. 排序与分页执行 =================
    const sortBy = input.sortBy || 'updatedAt';
    if (sortBy === 'price') qb.orderBy('hotel.miniPrice', 'ASC');
    else if (sortBy === 'score') qb.orderBy('hotel.score', 'DESC');
    else if (sortBy === 'distance' && hasDisplayGeo) qb.orderBy('distance', 'ASC'); // 修复报错点
    else qb.orderBy('hotel.updatedAt', 'DESC');

    qb.groupBy('hotel.id');
    qb.offset((page - 1) * pageSize).limit(pageSize);

    const { entities, raw } = await qb.getRawAndEntities();
    const total = await qb.getCount();

    if (entities.length === 0) {
      return { list: [], total, page, pageSize };
    }

    // ================= 5. 数据组装 =================
    const hotelIds = entities.map(h => h.id);
    const relationsData = await this.hotelRepo.find({
      where: { id: In(hotelIds) },
      relations: ['tags', 'facilities', 'roomTypes', 'images'],
    });

    const listWithDistance = entities.map((hotel) => {
      const relationInfo = relationsData.find(r => r.id === hotel.id);
      if (relationInfo) {
        hotel.tags = relationInfo.tags;
        hotel.facilities = relationInfo.facilities;
        hotel.roomTypes = relationInfo.roomTypes?.sort((a, b) => Number(a.basePrice) - Number(b.basePrice)) || [];
        hotel.images = relationInfo.images?.sort((a, b) => a.sortOrder - b.sortOrder) || [];
      }

      let distance: number | null = null;
      let distanceText: string | null = null;

      if (hasDisplayGeo) {
        const rawData = raw.find((r) => r.hotel_id === hotel.id);
        if (rawData?.distance) {
          distance = Math.round(Number(rawData.distance));
        } else if (hotel.latitude != null && hotel.longitude != null) {
          const distKm = this.calculateDistance(displayLat, displayLng, hotel.latitude, hotel.longitude);
          distance = Math.round(distKm * 1000);
        }

        if (distance !== null) {
          if (distance < 1000) distanceText = `${Math.round(distance / 10) * 10}m`;
          else distanceText = `${(distance / 1000).toFixed(1)}km`;
        }
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
    const city = getCityByCode(cityCode);
    return city ? city.name : cityCode;
  }

}
