import { useMutation, useQuery } from '@apollo/client/react';
import {
  CANCEL_ORDER_MUTATION,
  CREATE_ORDER_MUTATION,
  MY_ORDERS_QUERY,
  ORDER_DETAIL_QUERY,
} from '../graphql/order';
import { client } from '../utils/apollo';
import type { BookingPriceSnapshot } from '../store/bookingStore';

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'COMPLETED';

export interface CreateOrderInput {
  hotelId: string;
  roomTypeId: string;
  ratePlanId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  priceSnapshot: BookingPriceSnapshot;
  guestName: string;
  guestPhone: string;
}

type ServerCreateOrderInput = Omit<CreateOrderInput, 'ratePlanId' | 'priceSnapshot'>;

export interface Order {
  id: string;
  userId: string;
  hotelId: string;
  hotelName: string;
  roomTypeId: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderConnection {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
}

interface CreateOrderMutationData {
  createOrder: Order;
}

interface MyOrdersQueryData {
  myOrders: OrderConnection;
}

interface OrderDetailQueryData {
  order: Order;
}

interface CancelOrderMutationData {
  cancelOrder: Order;
}

export class OrderServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderServiceError';
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  const apolloError = error as {
    graphQLErrors?: Array<{ message?: string }>;
    networkError?: { message?: string };
    message?: string;
  };
  return (
    apolloError.graphQLErrors?.find(({ message }) => message)?.message ||
    apolloError.networkError?.message ||
    apolloError.message ||
    fallback
  );
}

/** 创建订单；价格和库存均由服务端重新校验。 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  try {
    const { ratePlanId, priceSnapshot, ...serverInput } = input;
    if (!ratePlanId.trim()) {
      throw new OrderServiceError('价格方案信息不完整，请返回酒店详情重新选择');
    }
    const expectedNights = Math.round(
      (
        new Date(`${input.checkOut}T00:00:00.000Z`).getTime()
        - new Date(`${input.checkIn}T00:00:00.000Z`).getTime()
      ) / 86400000,
    );
    if (
      !priceSnapshot
      || priceSnapshot.currency !== 'CNY'
      || priceSnapshot.checkIn !== input.checkIn
      || priceSnapshot.checkOut !== input.checkOut
      || priceSnapshot.guestCount !== input.guestCount
      || priceSnapshot.nights !== expectedNights
      || expectedNights <= 0
      || !Number.isFinite(priceSnapshot.nightlyPrice)
      || !Number.isFinite(priceSnapshot.totalPrice)
      || priceSnapshot.nightlyPrice < 0
      || priceSnapshot.totalPrice < 0
      || Math.abs(
        priceSnapshot.totalPrice
        - priceSnapshot.nightlyPrice * priceSnapshot.nights
      ) > 0.01
    ) {
      throw new OrderServiceError('报价快照已失效，请返回酒店详情重新选择');
    }

    const { data } = await client.mutate<
      CreateOrderMutationData,
      { input: ServerCreateOrderInput }
    >({
      mutation: CREATE_ORDER_MUTATION,
      // 当前服务端为单报价模型，只提交它支持的字段；方案和客户端报价
      // 在此处用于确认页一致性校验，最终价格仍由服务端重新计算。
      variables: { input: serverInput },
      fetchPolicy: 'no-cache',
    });

    if (!data?.createOrder?.id) {
      throw new OrderServiceError('创建订单返回数据无效');
    }
    return data.createOrder;
  } catch (error) {
    if (error instanceof OrderServiceError) throw error;
    throw new OrderServiceError(getErrorMessage(error, '创建订单失败，请稍后重试'));
  }
}

export function useMyOrders(page = 1, pageSize = 20, enabled = true) {
  const query = useQuery<
    MyOrdersQueryData,
    { pagination: { page: number; pageSize: number } }
  >(MY_ORDERS_QUERY, {
    variables: { pagination: { page, pageSize } },
    skip: !enabled,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  return {
    orders: query.data?.myOrders.items ?? [],
    total: query.data?.myOrders.total ?? 0,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useOrderDetail(id: string, enabled = true) {
  const query = useQuery<OrderDetailQueryData, { id: string }>(ORDER_DETAIL_QUERY, {
    variables: { id },
    skip: !id || !enabled,
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  return {
    order: query.data?.order,
    loading: query.loading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCancelOrder() {
  const [run, state] = useMutation<CancelOrderMutationData, { id: string }>(
    CANCEL_ORDER_MUTATION,
  );

  return {
    cancelOrder: async (id: string) => {
      try {
        const result = await run({ variables: { id } });
        if (!result.data?.cancelOrder?.id) {
          throw new OrderServiceError('取消订单返回数据无效');
        }
        return result.data.cancelOrder;
      } catch (error) {
        if (error instanceof OrderServiceError) throw error;
        throw new OrderServiceError(getErrorMessage(error, '取消订单失败，请稍后重试'));
      }
    },
    loading: state.loading,
  };
}
