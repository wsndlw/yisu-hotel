import { useQuery } from '@apollo/client';
import { Button, Card, Col, Form, InputNumber, Modal, Row, Switch } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { HOTEL } from '../../../graphql/hotel';
import styles from './index.module.css';
import RoomTypeList from '../../../componenets/RoomTypeList';
import  { useState } from 'react';
import { useHotelDetail } from '../../../services/hotel';
import { useUpdateRoomOps } from '../../../services/roomType';
import RoomCalendarDrawer from '../HotelEdit/components/RoomCalendarDrawer';

export default function RoomManagement() {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const { data, loading } = useQuery(HOTEL, {
    variables: { id: hotelId },
    skip: !hotelId,
  });
  const hotel = data?.hotel?.data;
  console.log('hotel', hotel);
  const { data: detail, refetch } = useHotelDetail(hotelId);
  const [updateRoomOps, updatingOps] = useUpdateRoomOps();
  const [opsForm] = Form.useForm();
  const [opsOpen, setOpsOpen] = useState(false);
  const [opsRoom, setOpsRoom] = useState<any | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarRoom, setCalendarRoom] = useState<any | null>(null);

  const rooms = detail?.roomTypes || [];
  const disabled = hotel?.status === 'DRAFT';

  const openOps = (room: any) => {
    setOpsRoom(room);
    opsForm.setFieldsValue({
      basePrice: room.basePrice,
      stock: room.stock,
      isOnSale: !!room.isOnSale,
      hasBreakfast: !!room.hasBreakfast,
      refundable: !!room.refundable,
    });
    setOpsOpen(true);
  };

  const submitOps = async () => {
    if (!opsRoom) return;
    const values = await opsForm.validateFields();
    await updateRoomOps(opsRoom.id, values, () => {
      setOpsOpen(false);
      refetch();
    });
  };

  const openCalendar = (room: any) => {
    setCalendarRoom(room);
    setCalendarOpen(true);
  };

  return (
    <div className={styles.page}>
      <Card
        title={
          <div className={styles.header}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              返回
            </Button>
            <span>{hotel?.nameZh || '加载中...'} - 日常管理</span>
          </div>
        }
        loading={loading}
      >
        {hotelId && hotel && (
          <RoomTypeList
            data={rooms}
            operationsOnly={true}
            disabled={disabled}
            onOps={openOps}
            onCalendar={openCalendar}
          />
        )}
      </Card>

      <RoomCalendarDrawer
        open={calendarOpen}
        roomType={calendarRoom}
        disabled={disabled}
        onClose={() => setCalendarOpen(false)}
      />

   <Modal
        open={opsOpen}
        title={`运营调整 - ${opsRoom?.name || '房型'}`}
        onCancel={() => setOpsOpen(false)}
        onOk={submitOps}
        confirmLoading={updatingOps}
      >
        <Form form={opsForm} layout="vertical">
          <Row >
            <Col span={12}>
              <Form.Item name="basePrice" label="房型价格" rules={[{ required: true }]}>
                <InputNumber min={0} className={styles.fullWidth} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stock" label="库存">
                <InputNumber min={0} className={styles.fullWidth} />
              </Form.Item>
            </Col>
          </Row>
          <Row >
            <Col span={8}>
              <Form.Item name="isOnSale" label="是否开售" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="hasBreakfast" label="含早" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="refundable" label="可退" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

