import { useQuery } from '@apollo/client';
import { GET_BANNERS } from '../graphql/banner-h5';
import { Banner } from '../types/banner';

type RawBanner = {
  id: string;
  imageUrl: string;
  targetHotelId: string;
  sort: number;
  startAt?: string | null;
  endAt?: string | null;
};

/**
 * 移动端 Banner 列表（React Hooks）
 *
 * - 后端已完成 enabled + startAt/endAt 的时间窗口筛选
 * - 这里做字段映射：targetHotelId -> redirectHotelId
 */
export function useBanners() {
  const { data, loading, error, refetch } = useQuery(GET_BANNERS, {
    fetchPolicy: 'network-only',
  });

  const list = (data?.bannersQuery || []) as RawBanner[];
  const banners: Banner[] = list.map((b) => ({
    id: b.id,
    imageUrl: b.imageUrl,
    redirectHotelId: b.targetHotelId,
    sort: b.sort ?? 0,
  }));

  return {
    banners,
    loading,
    error,
    refetch,
  };
}
