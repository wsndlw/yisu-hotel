import { getCityByCode, getCityByName } from '../../common/constants/city';

/**
 * 城市数据迁移工具
 * 将旧数据（城市名称）转换为新数据（城市编码）
 */
export function migrateCityData(city: string): string {
  // 如果已经是6位编码，直接返回
  if (/^\d{6}$/.test(city)) {
    return city;
  }

  // 尝试通过名称查找编码
  const cityInfo = getCityByName(city);
  if (cityInfo) {
    return cityInfo.code;
  }

  // 如果找不到，返回原值（兼容性处理）
  return city;
}

/**
 * 获取城市显示名称
 * 支持编码和名称两种格式
 */
export function getCityDisplayName(city: string): string {
  // 如果是编码，转换为名称
  if (/^\d{6}$/.test(city)) {
    const cityInfo = getCityByCode(city);
    return cityInfo ? cityInfo.name : city;
  }

  // 否则直接返回
  return city;
}
