import React, { useEffect } from 'react';
import { Form, Input, Button, Select, DatePicker, Divider } from 'antd';
import dayjs from 'dayjs';
import CitySelect from '../../../../../componenets/CitySelector';
import FacilitySelector from '../../../../../componenets/FacilitySelector';
import MapPicker from '../../../../../componenets/MapPicker';
import OSSImageUpload from '../../../../../componenets/OSSImageUpload';
import { useCreateHotel, useUpdateHotel, useSetHotelImages } from '../../../../../services/hotel';

interface BasicInfoFormProps {
  hotelId?: string;
  initialData?: any;
  onSaveSuccess: (hotelId: string) => void;
  disabled?: boolean;
}
//基础信息表格，名称、地址、图片等。
export default function BasicInfoForm({ hotelId, initialData, onSaveSuccess, disabled }: BasicInfoFormProps) {
  const [form] = Form.useForm();
  const [createHotel, creating] = useCreateHotel();
  const [updateHotel, updating] = useUpdateHotel();
  const [setHotelImages] = useSetHotelImages();

  useEffect(() => {
    if (initialData) {

      let facilityIds: string[] = [];
      if (Array.isArray(initialData.facilities)) {
        facilityIds = initialData.facilities.map((f: any) => f.id);
      }

      let bannerImages: any[] = [];
      if (Array.isArray(initialData.images) && initialData.images.length > 0) {
        bannerImages = initialData.images.map((img: any) => ({
          uid: img.id || img.url,
          name: 'image.png',
          status: 'done',
          url: img.url,
        }));
      }

      form.setFieldsValue({
        nameZh: initialData.nameZh,
        nameEn: initialData.nameEn,
        address: initialData.address,
        city: initialData.city,
        starLevel: initialData.starLevel,
        openSince: initialData.openSince ? dayjs(initialData.openSince) : null,
        nearby: Array.isArray(initialData.nearby) ? initialData.nearby : [],
        discountInfo: initialData.discountInfo,
        facilityIds,
        geo: initialData.latitude && initialData.longitude
          ? { latitude: initialData.latitude, longitude: initialData.longitude }
          : undefined,
        bannerImages,
      });
    }
  }, [initialData, form]);

  // 地图选点后填充地址
  const handleGeoChange = (value: any) => {
    if (value?.address) {
      form.setFieldValue('address', value.address);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const input = {
        nameZh: values.nameZh,
        nameEn: values.nameEn,
        address: values.address,
        city: values.city,
        starLevel: values.starLevel,
        openSince: values.openSince ? values.openSince.format('YYYY-MM-DD') : undefined,
        nearby: values.nearby || [],
        discountInfo: values.discountInfo,
        facilityIds: values.facilityIds || [],
        latitude: values.geo?.latitude,
        longitude: values.geo?.longitude,
        isSubmit: false,
      };

      let savedHotelId = hotelId;
      if (hotelId) {
        await updateHotel(hotelId, input, () => { });
      } else {
        const newHotel = await createHotel(input, () => { });
        savedHotelId = newHotel?.id;
      }

      // 保存 Banner 图片
      if (savedHotelId && values.bannerImages) {
        // values.bannerImages 是 UploadFile 数组
        const imageUrls = values.bannerImages
          .map((f: any) => f.url || f.response?.url)
          .filter((url: string) => url && url.trim());

        if (imageUrls.length > 0) {
          await setHotelImages(savedHotelId, imageUrls, () => { });
        }
      }

      if (savedHotelId) {
        onSaveSuccess(savedHotelId);
      }
    } catch (error: any) {
      console.error('保存失败', error);
    }
  };

  return (
    <Form form={form} layout="vertical" disabled={disabled}>
      <Form.Item name="nameZh" label="酒店中文名" rules={[{ required: true, message: '请输入酒店中文名' }]}>
        <Input placeholder="请输入酒店中文名" />
      </Form.Item>

      <Form.Item name="nameEn" label="酒店英文名">
        <Input placeholder="请输入酒店英文名" />
      </Form.Item>

      <Form.Item name="city" label="所在城市" rules={[{ required: true, message: '请选择城市' }]}>
        <CitySelect />
      </Form.Item>

      <Form.Item name="starLevel" label="星级" rules={[{ required: true, message: '请选择星级' }]}>
        <Select placeholder="请选择星级">
          {[1, 2, 3, 4, 5].map(level => (
            <Select.Option key={level} value={level}>{level}星</Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="openSince" label="开业时间">
        <DatePicker
          style={{ width: '100%' }}
          disabledDate={(current) => current && current > dayjs().endOf('day')}
          placeholder="请选择开业时间"
        />
      </Form.Item>


      <Form.Item name="address" label="详细地址" rules={[{ required: true, message: '请输入详细地址' }]}>
        <Input placeholder="请输入详细地址" />
      </Form.Item>

      <Form.Item name="geo" label="位置坐标">
        <MapPicker
          onChange={handleGeoChange}
          onAddressChange={(addr) => form.setFieldValue('address', addr)}
        />
      </Form.Item>

      <Form.Item name="discountInfo" label="优惠信息">
        <Input.TextArea rows={3} placeholder="请输入优惠信息" />
      </Form.Item>

      <Form.Item name="facilityIds" label="酒店设施">
        <FacilitySelector />
      </Form.Item>

      <Divider>酒店图片</Divider>

      <Form.Item
        name="bannerImages"
        label="Banner 轮播图"
        tooltip="建议比例 16:9，用于酒店详情页轮播展示"
        rules={[{ required: true, message: '请上传至少一张轮播图' }]}
        valuePropName="value"
        getValueFromEvent={(e: any) => {
          if (Array.isArray(e)) {
            return e;
          }
          return e?.fileList;
        }}
      >
        <OSSImageUpload
          maxCount={10}
          imgCropAspect={16 / 9}
          label="上传轮播图"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          onClick={handleSave}
          loading={creating || updating}
          disabled={disabled}
          block
        >
          保存并下一步
        </Button>
      </Form.Item>
    </Form>
  );
}
