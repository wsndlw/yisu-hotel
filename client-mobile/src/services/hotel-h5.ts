import { useMemo } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client';
import {
  GET_HOME_CONFIG,
  SEARCH_HOTELS,
  GET_HOTEL_DETAIL,
  POI_LIST,
  HOTEL_MIN_PRICE_CALENDAR
} from '../graphql/hotel-h5';
import { useBanners } from './banner-h5';
import {
  SearchHotelInput,
  HotelDetail,
  HotelConnection,
  PoiListInput,
  PoiItem,
  HotelMinPriceCalendarInput,
  HotelMinPriceCalendar
} from '../types/hotel';

function buildBizError(result: any) {
  return result && result.code !== 200 ? new Error(result.message || '请求失败') : undefined;
}

// ✅ 2. 定义通用 API 响应结构 (包含 code, message, data)
// 定义各个接口的 Response 结构
type ApiResponse<T> = {
  code: number;
  message?: string;
  data: T;
};

type SearchHotelsRes = {
  searchHotels: ApiResponse<HotelConnection>; // 直接使用 HotelConnection，因为它包含了 items, total, page
};

type HomeConfigRes = {
  homeConfig: ApiResponse<any>;
};

type HotelDetailRes = {
  hotelDetail: ApiResponse<HotelDetail>;
};

type PoiListRes = {
  poiList: PoiItem[]; // 注意：根据你的 GraphQL，这里好像没有包装 code/message/data，直接返回数组？
                      // 如果实际返回有 code/message，请改为 ApiResponse<PoiItem[]>
};

type CalendarRes = {
  hotelMinPriceCalendar: HotelMinPriceCalendar;
};

/**
 * 首页聚合数据（React Hooks）
 *
 * 注意：后端 homeConfig 内部返回的 banners 可能不包含 startAt/endAt 的时间窗口过滤。
 * 如果希望 banner 严格按时间生效，请用 useHomeConfigV2。
 */
export function useHomeConfig() {
  const { data, loading, error, refetch } = useQuery<HomeConfigRes>(GET_HOME_CONFIG, {
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
      banners: banners.banners, // 使用 banner-h5 处理过的数据
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
  // ✅ 3. 泛型使用了 SearchHotelsRes
  const [run, { data, loading, error, refetch }] = useLazyQuery<SearchHotelsRes>(SEARCH_HOTELS, {
    fetchPolicy: 'network-only',
  });

  const result = data?.searchHotels;
  const bizError = buildBizError(result);
  
  // ✅ 4. 数据解包：HotelConnection 里已经包含了 items 和 page 信息
  const connection = result?.code === 200 ? result.data : undefined;

  return {
    // 这里的 input 必须严格符合 SearchHotelInput 接口（注意 pagination 是嵌套对象）
    search: (input: SearchHotelInput) => run({ variables: { input } }),
    data: connection, 
    loading,
    error: error || bizError,
    refetch,
  };
}

/**
 * 酒店详情与房型列表（React Hooks）
 */
export function useHotelDetail(id?: string, checkIn?: string, checkOut?: string) {
  const { data, loading, error, refetch } = useQuery<HotelDetailRes>(GET_HOTEL_DETAIL, {
    variables: { id, checkIn, checkOut },
    skip: !id,
    fetchPolicy: 'network-only',
  });

  const result = data?.hotelDetail;
  const bizError = buildBizError(result);

  return {
    data: result?.code === 200 ? result.data : undefined,
    loading,
    error: error || bizError,
    refetch,
  };
}

export function usePoiList(input?: PoiListInput) {
  // 假设 POI 列表接口返回结构比较简单，如果包含 code/message 请参考上面的写法修改
  const { data, loading, error, refetch } = useQuery<{ poiList: PoiItem[] }>(POI_LIST, {
    variables: { input },
    skip: !input,
  });
  
  return {
    data: data?.poiList || [],
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
      skip: !input?.hotelId,
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
