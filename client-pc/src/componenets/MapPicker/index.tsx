import React, { useEffect, useMemo, useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { AimOutlined } from '@ant-design/icons';
import { Map, APILoader, Marker } from '@uiw/react-baidu-map';
import { wgs84tobd09, bd09towgs84 } from '../../utils/coord';

export interface MapPoint {
  latitude: number;
  longitude: number;
}

/**
 * 地图选点（百度地图组件）
 * ...
 */
export default function MapPicker(props: {
  value?: MapPoint;
  onChange?: (v: MapPoint) => void;
  onAddressChange?: (address: string) => void;
  height?: number;
}) {
  const height = props.height ?? 280;
  const [center, setCenter] = useState<MapPoint | undefined>(props.value);
  const [resolvedAddress, setResolvedAddress] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (props.value && props.value.longitude && props.value.latitude) {
      // WGS84 -> BD09
      const [bdLng, bdLat] = wgs84tobd09(props.value.longitude, props.value.latitude);
      setCenter({ latitude: bdLat, longitude: bdLng });
    } else {
      // 只有在没有传入值时，才自动定位
      handleLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value?.latitude, props.value?.longitude]);

  // 定位当前位置
  const handleLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const wgsLat = pos.coords.latitude;
        const wgsLng = pos.coords.longitude;

        const [bdLng, bdLat] = wgs84tobd09(wgsLng, wgsLat);
        setCenter({ latitude: bdLat, longitude: bdLng });

        // 定位成功后，如果之前没有值，则触发 onChange
        // 注意：这里是否触发 onChange 取决于需求，通常定位只是辅助选点，用户确认后再触发可能更好
        // 这里保持原逻辑：定位即选点
        props.onChange?.({ latitude: wgsLat, longitude: wgsLng });
        setLocationLoading(false);
      },
      () => {
        // 定位失败
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  const mapCenter = useMemo(() => {
    if (center) return { lng: center.longitude, lat: center.latitude };
    return { lng: 116.404, lat: 39.915 }; // 默认北京
  }, [center]);

  const onMapClick = (e: any) => {
    const bdLat = e.point.lat;
    const bdLng = e.point.lng;

    // BD09 -> WGS84
    const [wgsLng, wgsLat] = bd09towgs84(bdLng, bdLat);

    setCenter({ latitude: bdLat, longitude: bdLng });
    props.onChange?.({ latitude: wgsLat, longitude: wgsLng });
  };

  const onAutoAddress = () => {
    if (!center) return;

    // 使用百度地图反向地理编码
    const w: any = window as any;
    if (!w.BMap || !w.BMap.Geocoder) {
      console.warn('BMap not loaded');
      return;
    }

    const geocoder = new w.BMap.Geocoder();
    const point = new w.BMap.Point(center.longitude, center.latitude);

    geocoder.getLocation(point, (res: any) => {
      if (!res) return;
      const addr = res.address || '';
      setResolvedAddress(addr);
      // 调用 onAddressChange 将地址回传给父组件
      if (addr) props.onAddressChange?.(addr);
    });
  };

  const MapAny: any = Map;
  const APILoaderAny: any = APILoader;

  const ak = (import.meta.env.VITE_BAIDU_MAP_AK || '') as string;
  console.log('ak', ak);
  return (
    <div>
      <div style={{ marginBottom: 8, color: '#666' }}>进入页面会自动定位，也可以点击地图选点。</div>
      {!ak ? (
        <div style={{ color: '#cf1322', marginBottom: 8 }}>
          未配置百度地图 AK（VITE_BAIDU_MAP_AK），地图瓦片会加载失败。
        </div>
      ) : (
        <div style={{ color: '#999', marginBottom: 8 }}>已读取 AK（长度：{ak.length}）</div>
      )}
      <APILoaderAny akay={ak}>
        <MapAny
          style={{ height, width: '100%' }}
          zoom={15}
          enableScrollWheelZoom
          center={mapCenter}
          onClick={onMapClick}
        >
          {center && <Marker position={{ lng: center.longitude, lat: center.latitude }} />}
        </MapAny>
      </APILoaderAny>
      <Space style={{ marginTop: 8 }}>
        <Button onClick={onAutoAddress}>自动生成地址</Button>
        <Tooltip title="定位当前位置">
          <Button icon={<AimOutlined />} onClick={handleLocation} loading={locationLoading} />
        </Tooltip>
        {resolvedAddress ? <span style={{ color: '#666' }}>生成地址：{resolvedAddress}</span> : null}
      </Space>
    </div>
  );
}
