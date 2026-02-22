import { useState, useEffect, useMemo } from 'react';

import styles from './index.module.css';
import { Button, Card, message, Modal, Select, Space, Table } from 'antd';
import { fetchHotelDetailOnce, useDeleteHotel, useMyHotels, useRequestOffline, useSubmitHotel, useWithdrawHotel } from '../../../services/hotel';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { getColumns } from './constants';

/**
*商户酒店列表页面，可以看到所有酒店的状态和信息。
*/
const Hotels = ({ }) => {

  const nav = useNavigate();
  const loc = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = (searchParams.get('status') || 'ALL') as 'ALL' | 'PUBLISHED' | 'REVIEWING' | 'DRAFT' | 'REJECTED' | 'OFFLINE';

  const { data, loading, refetch } = useMyHotels();
  const [submitHandler] = useSubmitHotel();
  const [deleteHandler] = useDeleteHotel();
  const [withdrawHandler] = useWithdrawHotel();
  const [requestOfflineHandler] = useRequestOffline();

  const list = data || [];
  const filteredList = useMemo(() => {
    if (status === 'ALL') return list;
    return list.filter((item: any) => item.status === status);
  }, [list, status]);

  useEffect(() => {
    if (loc.state) {
      const state = loc.state as any;
      let handled = false;

      if (state.refresh) {
        refetch();
        handled = true;
      }
      if (state.status) {
        setSearchParams({ status: state.status });
        handled = true;
      }

      if (handled) {
        // 清除 state，防止刷新页面时重复触发
        // 注意：保留当前的 search 参数
        nav({ pathname: loc.pathname, search: loc.search }, { replace: true, state: null });
      }
    }
  }, [loc.state, refetch, nav, loc.pathname, loc.search, setSearchParams]);

  const onSubmit = async (id: string) => {
    try {
      const detail = await fetchHotelDetailOnce(id);
      const roomCount = Array.isArray(detail?.roomTypes) ? detail.roomTypes.length : 0;
      if (!roomCount) {
        message.error('请先添加至少一个房型再提交审核');
        return;
      }
      await submitHandler(id, () => {
        refetch();
      });
    } catch (error) {
      message.error('获取酒店详情失败，请稍后重试');
    }
  };

  const onDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个酒店吗？',
      okType: 'danger',
      onOk: async () => {
        await deleteHandler(id, () => {
          refetch();
        });
      },
    });
  };

  const onWithdraw = async (id: string) => {
    await withdrawHandler(id, () => {
      refetch();
    });
  };



  const onRequestOffline = async (id: string) => {
    await requestOfflineHandler(id, () => {
      refetch();
    });
  };



  return (
    <Card
      title="我的酒店"
      extra={
        <Space>
          <Button type="primary" onClick={() => nav('/merchant/hotels/new')}>
            新建酒店
          </Button>
        </Space>
      }
    >
      {/* 统计卡片已移动到仪表盘 */}
      <Space className={styles.filters}>
        <span>状态筛选：</span>
        <Select
          value={status}
          className={styles.filterInput}
          onChange={(val) => setSearchParams({ status: val })}
          options={[
            { value: 'ALL', label: '全部' },
            { value: 'PUBLISHED', label: '已发布' },
            { value: 'REVIEWING', label: '审核中' },
            { value: 'DRAFT', label: '草稿' },
            { value: 'REJECTED', label: '已驳回' },
          ]}
        />
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={filteredList}
        columns={getColumns({ onRequestOffline, onSubmit, onDelete, onWithdraw })}
      />

    </Card>
  );
}


export default Hotels;
