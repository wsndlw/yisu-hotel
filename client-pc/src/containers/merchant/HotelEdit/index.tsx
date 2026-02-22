import { useState, useEffect } from 'react';

import styles from './index.module.css';
import { Button, Card, message, Space, Tabs } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useHotelDetail, useSubmitHotel } from '../../../services/hotel';
import BasicInfoForm from './components/BasicInfoForm';
import RoomTypeEdit from './components/RoomTypeEdit';

interface HotelEditProps {
  mode?: 'create' | 'edit';
}
/**
*酒店新建/编辑页面，包括基础信息和房型信息。这里修改的信息会触发审核
*/
const HotelEdit = (props: HotelEditProps) => {
 const nav = useNavigate();
  const params = useParams();
  const urlId = params.id;
  
  // 自动推断 mode: 如果 props 没传，且有 urlId，则是 edit，否则是 create
  const mode = props.mode || (urlId ? 'edit' : 'create');
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get('tab') === 'rooms' ? 'rooms' : 'basic';

  const [activeTab, setActiveTab] = useState<'basic' | 'rooms'>(initialTab);
  const [hotelId, setHotelId] = useState<string | undefined>(urlId);
  const [canEditRooms, setCanEditRooms] = useState(!!urlId);

  const { data: hotel, refetch } = useHotelDetail(hotelId);
  const [submitHotel, submitting] = useSubmitHotel();

  // 当 URL 参数变化时更新 hotelId
  useEffect(() => {
    if (urlId && urlId !== hotelId) {
      setHotelId(urlId);
    }
  }, [urlId, hotelId]);


  // 判断是否可以编辑
  const canEdit = mode === 'create' || (hotel && hotel.status !== 'REVIEWING');

  useEffect(() => {
    if (urlId && urlId !== hotelId) {
      setHotelId(urlId);
      setCanEditRooms(true);
    }
  }, [urlId, hotelId]);

  // 基础信息保存成功回调
  const handleBasicInfoSaved = (savedHotelId: string) => {
    setHotelId(savedHotelId);
    setCanEditRooms(true);

    // 更新 URL
    if (mode === 'create') {
      nav(`/merchant/hotels/${savedHotelId}`, { replace: true });
    }

    // 自动切换到房型管理 Tab
    setActiveTab('rooms');
    refetch();
  };

  // 提交审核
  const handleSubmit = async () => {
    if (!hotelId) {
      message.error('请先保存基础信息');
      return;
    }

    // 获取最新数据进行校验，避免因缓存导致校验失败
    const { data: res } = await refetch();
    const currentHotel = res?.hotel?.data;

    if (!currentHotel?.roomTypes || currentHotel.roomTypes.length === 0) {
      message.error('请至少添加一个房型');
      return;
    }

    try {
      await submitHotel(hotelId);
      nav('/merchant/hotels');
    } catch (error: any) {
      console.error('提交审核失败', error);
    }
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基础信息',
      children: (
        <BasicInfoForm
          hotelId={hotelId}
          initialData={hotel}
          onSaveSuccess={handleBasicInfoSaved}
          disabled={!canEdit}
        />
      ),
    },
    {
      key: 'rooms',
      label: '房型管理',
      disabled: !canEditRooms,
      children: hotelId ? (
        <RoomTypeEdit hotelId={hotelId} disabled={!canEdit} />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          保存基础信息后，可以添加房型
        </div>
      ),
    },
  ];

  return (
    <Card
      title={mode === 'create' ? '新建酒店' : `编辑酒店：${hotel?.nameZh || ''}`}
      extra={
        <Space>
          <Button onClick={() => nav('/merchant/hotels')}>
            返回
          </Button>
          {canEdit && hotelId && (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
            >
              提交审核
            </Button>
          )}
          {!canEdit && (
            <span style={{ color: '#ff4d4f' }}>
              ⚠️ 审核中的酒店不可编辑
            </span>
          )}
        </Space>
      }
    >
      {mode === 'edit' && (hotel?.status === 3 || hotel?.status === 'PUBLISHED') && (
        <div
          style={{
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            padding: '8px 12px',
            borderRadius: 4,
            marginBottom: 12,
            color: '#d48806',
          }}
        >
          ⚠️ 修改房型信息或基础信息后需要重新审核
        </div>
      )}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'basic' | 'rooms')}
        items={tabItems}
      />
    </Card>
  );
}


export default HotelEdit;
