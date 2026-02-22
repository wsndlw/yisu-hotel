import { useQuery } from '@apollo/client/react';
import { GET_FACILITIES_FOR_H5, GET_TAGS_FOR_H5, groupFacilitiesByCategory } from '../graphql/facility-h5';

/**
 * 移动端设施/标签服务 - React Hooks 封装
 * 
 * 提供设施和标签的查询功能
 * 支持按分类分组展示
 */

export interface FacilityItem {
  id: string;
  name: string;
  icon?: string;
  type: 'FACILITY' | 'TAG';
  category: 'BASIC' | 'ROOM' | 'DINING' | 'ENTERTAINMENT' | 'BUSINESS' | 'OTHER';
}

// ✅ 3. 定义接口返回的通用结构
interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

// ✅ 4. 定义 Query 的返回结构
interface FacilitiesRes {
  getFacilitiesForH5: ApiResponse<FacilityItem[]>;
}

interface TagsRes {
  getTagsForH5: ApiResponse<FacilityItem[]>;
}

/**
 * 获取设施列表
 * 
 * @returns 设施列表和分组数据
 * 
 * @example
 * ```typescript
 * function FacilityFilter() {
 *   const { facilities, facilitiesByCategory, loading } = useFacilitiesForH5();
 * 
 *   if (loading) return <Loading />;
 * 
 *   // 方式1：使用原始数据
 *   return (
 *     <div>
 *       {facilities.map(facility => (
 *         <Checkbox key={facility.id} value={facility.id}>
 *           {facility.name}
 *         </Checkbox>
 *       ))}
 *     </div>
 *   );
 * 
 *   // 方式2：使用分组数据
 *   return (
 *     <div>
 *       {Object.entries(facilitiesByCategory).map(([category, items]) => (
 *         <div key={category}>
 *           <h3>{getCategoryLabel(category)}</h3>
 *           {items.map(facility => (
 *             <Checkbox key={facility.id} value={facility.id}>
 *               {facility.name}
 *             </Checkbox>
 *           ))}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFacilitiesForH5() {
  const { data, loading, error, refetch } = useQuery<FacilitiesRes>(GET_FACILITIES_FOR_H5, {
    fetchPolicy: 'cache-first', // 设施数据变化不频繁，优先使用缓存
  });

  const result = data?.getFacilitiesForH5;
  const facilities = result?.code === 200 ? (result.data || []) : [];

  return {
    loading,
    error: error || (result && result.code !== 200 ? new Error(result.message) : undefined),
    facilities,
    facilitiesByCategory: groupFacilitiesByCategory(facilities),
    refetch,
  };
}

/**
 * 获取标签列表
 * 
 * @returns 标签列表和分组数据
 * 
 * @example
 * ```typescript
 * function TagFilter() {
 *   const { tags, tagsByCategory, loading } = useTagsForH5();
 * 
 *   if (loading) return <Loading />;
 * 
 *   return (
 *     <div>
 *       <h2>酒店特色</h2>
 *       {tags.map(tag => (
 *         <Tag 
 *           key={tag.id} 
 *           onClick={() => selectTag(tag.id)}
 *         >
 *           {tag.name}
 *         </Tag>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTagsForH5() {
  const { data, loading, error, refetch } = useQuery<TagsRes>(GET_TAGS_FOR_H5, {
    fetchPolicy: 'cache-first',
  });

  const result = data?.getTagsForH5;
  const tags = result?.code === 200 ? (result.data || []) : [];

  return {
    loading,
    error: error || (result && result.code !== 200 ? new Error(result.message) : undefined),
    tags,
    tagsByCategory: groupFacilitiesByCategory(tags),
    refetch,
  };
}

/**
 * 工具函数：获取分类标签
 * 
 * @param category 分类代码
 * @returns 分类中文名称
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    BASIC: '基础设施',
    ROOM: '客房设施',
    DINING: '餐饮服务',
    ENTERTAINMENT: '娱乐休闲',
    BUSINESS: '商务服务',
    OTHER: '其他',
  };
  return labels[category] || '其他';
}

/**
 * 工具函数：按分类排序
 * 
 * 定义分类的显示顺序
 */
export const CATEGORY_ORDER = ['BASIC', 'ROOM', 'DINING', 'ENTERTAINMENT', 'BUSINESS', 'OTHER'];

/**
 * 工具函数：获取排序后的分类列表
 * 
 * @param facilitiesByCategory 分组后的设施/标签对象
 * @returns 排序后的分类数组
 * 
 * @example
 * ```typescript
 * const { facilitiesByCategory } = useFacilitiesForH5();
 * const sortedCategories = getSortedCategories(facilitiesByCategory);
 * 
 * return (
 *   <div>
 *     {sortedCategories.map(([category, items]) => (
 *       <CategorySection key={category} title={getCategoryLabel(category)}>
 *         {items.map(item => <FacilityItem key={item.id} {...item} />)}
 *       </CategorySection>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function getSortedCategories(facilitiesByCategory: Record<string, any[]>) {
  return CATEGORY_ORDER.map((category) => [category, facilitiesByCategory[category] || []])
    .filter(([_, items]) => (items as any[]).length > 0);
}
