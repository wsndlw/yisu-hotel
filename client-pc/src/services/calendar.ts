import { useMutation, useQuery } from '@apollo/client';
import {
  BATCH_SET_CALENDAR_PRICE,
  BATCH_SET_CALENDAR_STOCK,
  CLEAR_CALENDAR_PRICE,
  CLEAR_CALENDAR_STOCK,
  MERCHANT_ROOMTYPE_CALENDAR,
} from '../graphql/calendar';
import { message } from 'antd';

export function useMerchantRoomTypeCalendar(roomTypeId?: string, startDate?: string, endDate?: string) {
  return useQuery(MERCHANT_ROOMTYPE_CALENDAR, {
    skip: !roomTypeId || !startDate || !endDate,
    fetchPolicy: 'no-cache',
    variables: {
      input: {
        roomTypeId,
        startDate,
        endDate,
      },
    },
  });
}

export function useBatchSetCalendarPrice() {
  const [mutate, { loading }] = useMutation(BATCH_SET_CALENDAR_PRICE);
  return [
    async (input: any, onSuccess?: () => void, silent = false) => {
      try {
        const res = await mutate({ variables: { input } });
        if (res.errors) throw new Error(res.errors[0].message);
        const r = (res.data as any)?.batchSetRoomTypePrice;
        if (r?.code !== 200) throw new Error(r?.message || '设置价格失败');
        if (!silent) message.success('价格已生效');
        onSuccess?.();
      } catch (e: any) {
        message.error(e.message || '设置价格失败');
        throw e;
      }
    },
    loading,
  ] as const;
}

export function useClearCalendarPrice() {
  const [mutate, { loading }] = useMutation(CLEAR_CALENDAR_PRICE);
  return [
    async (input: any, onSuccess?: () => void) => {
      try {
        const res = await mutate({ variables: { input } });
        if (res.errors) throw new Error(res.errors[0].message);
        const r = (res.data as any)?.clearRoomTypePrice;
        if (r?.code !== 200) throw new Error(r?.message || '清空价格失败');
        message.success('价格已清空');
        onSuccess?.();
      } catch (e: any) {
        message.error(e.message || '清空价格失败');
      }
    },
    loading,
  ] as const;
}

export function useBatchSetCalendarStock() {
  const [mutate, { loading }] = useMutation(BATCH_SET_CALENDAR_STOCK);
  return [
    async (input: any, onSuccess?: () => void, silent = false) => {
      try {
        const res = await mutate({ variables: { input } });
        if (res.errors) throw new Error(res.errors[0].message);
        const r = (res.data as any)?.batchSetRoomTypeStock;
        if (r?.code !== 200) throw new Error(r?.message || '设置库存失败');
        if (!silent) message.success('库存已生效');
        onSuccess?.();
      } catch (e: any) {
        message.error(e.message || '设置库存失败');
        throw e;
      }
    },
    loading,
  ] as const;
}

export function useClearCalendarStock() {
  const [mutate, { loading }] = useMutation(CLEAR_CALENDAR_STOCK);
  return [
    async (input: any, onSuccess?: () => void) => {
      try {
        const res = await mutate({ variables: { input } });
        if (res.errors) throw new Error(res.errors[0].message);
        const r = (res.data as any)?.clearRoomTypeStock;
        if (r?.code !== 200) throw new Error(r?.message || '清空库存失败');
        message.success('库存已清空');
        onSuccess?.();
      } catch (e: any) {
        message.error(e.message || '清空库存失败');
      }
    },
    loading,
  ] as const;
}
