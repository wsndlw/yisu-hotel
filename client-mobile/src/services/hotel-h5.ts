import { useMemo } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import { GET_HOME_CONFIG, SEARCH_HOTELS, GET_HOTEL_DETAIL, POI_LIST, HOTEL_MIN_PRICE_CALENDAR } from '../graphql/hotel-h5';
import { useBanners } from './banner-h5';
import { SearchHotelInput, HotelDetail, PoiListInput, PoiItem, HotelMinPriceCalendarInput, HotelMinPriceCalendar } from '../types/hotel';

function buildBizError(result: any) {
  return result && result.code !== 200 ? new Error(result.message || '请求失败') : undefined;
}

/**
 * 首页聚合数据（React Hooks）
 *
 * 注意：后端 homeConfig 内部返回的 banners 可能不包含 startAt/endAt 的时间窗口过滤。
 * 如果希望 banner 严格按时间生效，请用 useHomeConfigV2。
 */
export function useHomeConfig() {
  const { data, loading, error, refetch } = useQuery(GET_HOME_CONFIG, {
    fetchPolicy: 'network-only',
  });

  const result = data?.homeConfig;
  const bizError = buildBizError(result);

  return {
    data: result?.code === 200 ? result.data : undefined,
    loading,
    error: error || bizError,
    refetch,
  };
}

/**
 * 首页数据（推荐用法）：cities/facilities 走 homeConfig，banners 走 bannersQuery。
 *
 * 这样 banner 一定会在后端按 enabled + startAt/endAt 做过滤。
 */
export function useHomeConfigV2() {
  const home = useHomeConfig();
  const banners = useBanners();

  const data = useMemo(() => {
    if (!home.data) return undefined;
    return {
      ...home.data,
      banners: banners.banners,
    };
  }, [home.data, banners.banners]);

  return {
    data,
    loading: home.loading || banners.loading,
    error: home.error || banners.error,
    refetch: async () => {
      await Promise.all([home.refetch(), banners.refetch()]);
    },
  };
}

/**
 * 酒店搜索（React Hooks）
 *
 * 说明：这是高频接口，默认 network-only 以获取最新价格。
 *
 * 用法：
 * - const { search, data, loading } = useHotelSearch();
 * - search({ pageNum: 1, pageSize: 10, ... })
 */
export function useHotelSearch() {
  const [run, { data, loading, error, refetch }] = useLazyQuery(SEARCH_HOTELS, {
    fetchPolicy: 'network-only',
  });

  const result = data?.searchHotels;
  const bizError = buildBizError(result);

  return {
    search: (input: SearchHotelInput) => run({ variables: { input } }),
    data: result?.code === 200 ? result.data : undefined,
    loading,
    error: error || bizError,
    refetch,
  };
}

/**
 * 酒店详情与房型列表（React Hooks）
 */
export function useHotelDetail(id?: string, checkIn?: string, checkOut?: string) {
  const { data, loading, error, refetch } = useQuery(GET_HOTEL_DETAIL, {
    variables: { id, checkIn, checkOut },
    skip: !id,
    fetchPolicy: 'network-only',
  });

  const result = data?.hotelDetail;
  const bizError = buildBizError(result);

  return {
    data: result?.code === 200 ? (result.data as HotelDetail) : undefined,
    loading,
    error: error || bizError,
    refetch,
  };
}

export function usePoiList(input?: PoiListInput) {
  const { data, loading, error, refetch } = useQuery<{ poiList: PoiItem[] }>(POI_LIST, {
    variables: { input },
    skip: !input,
  });

  return {
    data: data?.poiList ?? [],
    loading,
    error,
    refetch,
  };
}

export function useHotelMinPriceCalendar(input?: HotelMinPriceCalendarInput) {
  const { data, loading, error, refetch } = useQuery<{ hotelMinPriceCalendar: HotelMinPriceCalendar }>(
    HOTEL_MIN_PRICE_CALENDAR,
    {
      variables: input,
      skip: !input,
      fetchPolicy: 'network-only',
    },
  );

  return {
    data: data?.hotelMinPriceCalendar,
    loading,
    error,
    refetch,
  };
}
