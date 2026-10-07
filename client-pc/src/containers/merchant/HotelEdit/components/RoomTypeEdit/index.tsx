import { useState } from 'react';
import { Button, Modal, Form, InputNumber, Switch } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from './index.module.css';
import { useHotelDetail } from '../../../../../services/hotel';
import { useDeleteRoomType, useUpdateRoomOps } from '../../../../../services/roomType';
import RoomCalendarDrawer from '../RoomCalendarDrawer';
import RoomTypeList from '../../../../../componenets/RoomTypeList';
import RoomDrawer from '../RoomDrawer';

interface RoomManagerProps {
  hotelId: string;
  disabled?: boolean;
  /** 分为两个模式，一个是编辑（触发审核），一个是运营管理 */
  operationsOnly?: boolean;
}

//编辑信息的房型列表页面，新增/删除房型。编辑信息。
export default function RoomTypeEdit({ hotelId, disabled, operationsOnly = false }: RoomManagerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const { data: hotel, refetch } = useHotelDetail(hotelId);
  const [deleteRoomType] = useDeleteRoomType();
  const [updateRoomOps, updatingOps] = useUpdateRoomOps();
  const [opsForm] = Form.useForm();
  const [opsOpen, setOpsOpen] = useState(false);
  const [opsRoom, setOpsRoom] = useState<any | null>(null);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarRoom, setCalendarRoom] = useState<any | null>(null);

  const rooms = hotel?.roomTypes || [];

  const handleAdd = () => {
    setEditingRoom(null);
    setDrawerOpen(true);
  };

  const handleEdit = (room: any) => {
    setEditingRoom(room);
    setDrawerOpen(true);
  };

  const handleDelete = (roomId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个房型吗？此操作不可恢复。',
      onOk: async () => {
        await deleteRoomType(roomId, () => {
          refetch();
        });
      },
    });
  };

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

  const handleSuccess = () => {
    refetch();
  };

  const openCalendar = (room: any) => {
    setCalendarRoom(room);
    setCalendarOpen(true);
  };

  return (
    <div>
      {!operationsOnly && (
        <div className={styles.addWrap}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            disabled={disabled}
          >
            添加房型
          </Button>
        </div>
      )}

      <RoomTypeList
        data={rooms}
        operationsOnly={operationsOnly}
        disabled={disabled}
        onEdit={handleEdit}
        onDelete={(roomId) => handleDelete(roomId)}
        onOps={openOps}
        onCalendar={openCalendar}
      />

      <RoomDrawer
        open={drawerOpen}
        hotelId={hotelId}
        roomId={editingRoom?.id}
        initialData={editingRoom}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleSuccess}
      />

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
          <Form.Item name="basePrice" label="房型价格" rules={[{ required: true }]}>
            <InputNumber min={0} className={styles.fullWidth} />
          </Form.Item>
          <Form.Item name="stock" label="库存">
            <InputNumber min={0} className={styles.fullWidth} />
          </Form.Item>
          <Form.Item name="isOnSale" label="是否开售" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="hasBreakfast" label="含早" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="refundable" label="可退" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
