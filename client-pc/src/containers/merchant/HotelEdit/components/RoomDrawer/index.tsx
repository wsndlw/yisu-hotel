import  { useEffect } from 'react';
import { Drawer, Form, Input, InputNumber, Button, Divider, Switch, Select } from 'antd';
import { useUpsertRoomType } from '../../../../../services/roomType';
import OSSImageUpload from '../../../../../componenets/OSSImageUpload';


interface RoomDrawerProps {
  open: boolean;
  hotelId: string;
  roomId?: string;
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

const BED_TYPE_OPTIONS = [
  { label: '大床', value: 'KING' },
  { label: '双床', value: 'TWIN' },
  { label: '家庭房', value: 'FAMILY' },
  { label: '套房', value: 'SUITE' },
];

//房型编辑抽屉，若为创建，则包括价格等信息，编辑模式，就只有名称、图片等，
// 因为会触发审核
export default function RoomDrawer({ open, hotelId, roomId, initialData, onClose, onSuccess }: RoomDrawerProps) {
  const [form] = Form.useForm();
  const [upsertRoomType, loading] = useUpsertRoomType();

  useEffect(() => {
    if (open && initialData) {
      let fileList: any[] = [];
      try {
        const urls = typeof initialData.images === 'string'
          ? JSON.parse(initialData.images || '[]')
          : Array.isArray(initialData.images)
            ? initialData.images
            : [];
        fileList = (urls || []).map((url: string, index: number) => ({
          uid: String(index),
          name: `room-${index}`,
          status: 'done',
          url,
        }));
      } catch {
        fileList = [];
      }

      form.setFieldsValue({
        name: initialData.name,
        bedType: initialData.bedType,
        basePrice: initialData.basePrice,
        maxGuests: initialData.maxGuests,
        stock: initialData.stock,
        images: fileList,
        isOnSale: initialData.isOnSale ?? true,
        hasBreakfast: initialData.hasBreakfast,
        refundable: initialData.refundable,
        area: initialData.area,
        floor: initialData.floor,
        hasWindow: initialData.hasWindow,
        sortOrder: initialData.sortOrder,
      });
    } else if (open && !initialData) {
      form.resetFields();
    }
  }, [open, initialData, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // 处理图片：提取 url 并转为 JSON 字符串
      let imageJson: string | undefined = undefined;
      if (values.images && Array.isArray(values.images)) {
        const urls = values.images
          .map((file: any) => file.url || file.response?.url)
          .filter((url: string) => url && url.trim());
        if (urls.length > 0) {
          imageJson = JSON.stringify(urls);
        }
      }

      const input = {
        name: values.name,
        bedType: values.bedType,
        basePrice: isEdit ? Number(values.basePrice ?? initialData?.basePrice ?? 0) : Number(values.basePrice),
        maxGuests: values.maxGuests ? Number(values.maxGuests) : undefined,
        stock: values.stock ? Number(values.stock) : undefined,
        images: imageJson, // 确保是 JSON 字符串
        isOnSale: values.isOnSale ?? true,
        hasBreakfast: values.hasBreakfast ?? false,
        refundable: values.refundable ?? false,
        area: values.area ? Number(values.area) : undefined,
        floor: values.floor || undefined,
        hasWindow: values.hasWindow ?? false,
        sortOrder: values.sortOrder ? Number(values.sortOrder) : 0,
      };

      console.log('Submitting RoomType Input:', input); // 调试日志

      await upsertRoomType(hotelId, roomId || null, input, () => {
        onSuccess();
        onClose();
      });
    } catch (error: any) {
      console.error('保存房型失败', error);
    }
  };

  const isEdit = !!roomId;

  return (
    <Drawer
      title={roomId ? '编辑房型' : '添加房型'}
      open={open}
      onClose={onClose}
      width={600}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            取消
          </Button>
          <Button type="primary" onClick={handleSave} loading={loading}>
            保存房型
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="房型名称"
          rules={[{ required: true, message: '请输入房型名称' }]}
        >
          <Input placeholder="例如：豪华大床房" />
        </Form.Item>

        <Form.Item
          name="bedType"
          label="床型"
          rules={[{ required: true, message: '请选择床型' }]}
        >
          <Select
            placeholder="请选择床型"
            options={BED_TYPE_OPTIONS}
          />
        </Form.Item>

        {!isEdit && (
          <>
            <Form.Item
              name="basePrice"
              label="价格（元/晚）"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入价格" />
            </Form.Item>

            <Form.Item
              name="stock"
              label="库存"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="可选" />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="maxGuests"
          label="可住人数"
        >
          <InputNumber min={1} style={{ width: '100%' }} placeholder="可选" />
        </Form.Item>

        {!isEdit && (
          <>
            <Divider>销售属性</Divider>

            <Form.Item name="isOnSale" label="是否开售" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="hasBreakfast" label="含早" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="refundable" label="可退" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="hasWindow" label="有窗" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="area" label="房间面积(㎡)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="可选" />
            </Form.Item>
            <Form.Item name="floor" label="楼层">
              <Input placeholder="例如：3-5层" />
            </Form.Item>
          </>
        )}

        <Divider>房型图片</Divider>

        <Form.Item
          name="images"
          label="房型图片"
          tooltip="建议比例 4:3"
        >
          <OSSImageUpload maxCount={5} imgCropAspect={4 / 3} label="上传房型图片" />
        </Form.Item>

        <Form.Item
          name="sortOrder"
          label="排序"
        >
          <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
