import { gql } from '@apollo/client';

/**
 * 移动端设施/标签相关 GraphQL 查询
 * 
 * 注意事项：
 * 1. 标签和设施现在合并在同一个表中，通过 type 字段区分
 * 2. 通过 category 字段可以分组展示（基础设施、客房设施、餐饮服务等）
 * 3. 只返回启用的设施
 */

/**
 * 获取设施列表（用于筛选条件）
 * 
 * 返回所有启用的设施，type = 'FACILITY'
 * 
 * 使用场景：
 * - 酒店筛选页面的设施筛选器
 * - 按分类分组展示（BASIC、ROOM、DINING等）
 * 
 * 返回字段：
 * - id: 设施ID
 * - name: 设施名称（如"免费WiFi"、"停车场"）
 * - category: 分类（BASIC=基础设施, ROOM=客房设施, DINING=餐饮服务等）
 * - type: 类型（固定为 FACILITY）
 */
export const GET_FACILITIES_FOR_H5 = gql`
  query GetFacilitiesForH5 {
    getFacilitiesForH5 {
      code
      message
      data {
        id
        name
        category
        type
      }
    }
  }
`;

/**
 * 获取标签列表（用于筛选条件）
 * 
 * 返回所有启用的标签，type = 'TAG'
 * 
 * 使用场景：
 * - 酒店筛选页面的标签筛选器
 * - 酒店特色展示（如"亲子友好"、"近地铁"）
 * 
 * 返回字段：
 * - id: 标签ID
 * - name: 标签名称（如"亲子友好"、"近地铁"）
 * - category: 分类（用于分组展示）
 * - type: 类型（固定为 TAG）
 */

//有问题
export const GET_TAGS_FOR_H5 = gql`
  query GetTagsForH5 {
    getTagsForH5 {
      code
      message
      data {
        id
        name
        category
        type
      }
    }
  }
`;

/**
 * 设施分类枚举常量
 * 
 * 前端使用这些常量进行分组展示
 */
export const FACILITY_CATEGORIES = {
  BASIC: { label: '基础设施', value: 'BASIC', description: 'WiFi、停车场、电梯等' },
  ROOM: { label: '客房设施', value: 'ROOM', description: '空调、热水、吹风机等' },
  DINING: { label: '餐饮服务', value: 'DINING', description: '中餐厅、西餐厅、咖啡厅等' },
  ENTERTAINMENT: { label: '娱乐休闲', value: 'ENTERTAINMENT', description: '健身房、游泳池、SPA等' },
  BUSINESS: { label: '商务服务', value: 'BUSINESS', description: '会议室、商务中心等' },
  OTHER: { label: '其他', value: 'OTHER', description: '其他设施' },
} as const;

/**
 * 工具函数：按分类分组设施
 * 
 * @param facilities 设施数组
 * @returns 按分类分组的对象
 * 
 * 示例：
 * ```typescript
 * const facilities = [
 *   { id: '1', name: 'WiFi', category: 'BASIC' },
 *   { id: '2', name: '空调', category: 'ROOM' }
 * ];
 * const grouped = groupFacilitiesByCategory(facilities);
 * // 结果：
 * // {
 * //   BASIC: [{ id: '1', name: 'WiFi', category: 'BASIC' }],
 * //   ROOM: [{ id: '2', name: '空调', category: 'ROOM' }]
 * // }
 * ```
 */
export function groupFacilitiesByCategory(facilities: any[]) {
  const grouped: Record<string, any[]> = {};
  
  facilities.forEach((facility) => {
    const category = facility.category || 'OTHER';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(facility);
  });
  
  return grouped;
}

/**
 * 工具函数：获取分类标签
 * 
 * @param category 分类值（如 'BASIC'）
 * @returns 分类标签（如 '基础设施'）
 */
export function getCategoryLabel(category: string): string {
  return FACILITY_CATEGORIES[category as keyof typeof FACILITY_CATEGORIES]?.label || '其他';
}
