import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, Space, Tooltip } from 'antd';
import styles from './index.module.css';
import { AimOutlined } from '@ant-design/icons';
import { Map, APILoader, Marker } from '@uiw/react-baidu-map';
import { wgs84tobd09, bd09towgs84 } from '../../utils/coord';

export interface MapPoint {
  latitude: number;
  longitude: number;
}

/**
 * 地图选点（百度地图）
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
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

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

  const onSearchAddress = () => {
    const keyword = searchKeyword.trim();
    if (!keyword) return;

    const w: any = window as any;
    if (!w.BMap || !w.BMap.LocalSearch) {
      console.warn('BMap not loaded');
      return;
    }

    setSearching(true);
    const point = new w.BMap.Point(mapCenter.lng, mapCenter.lat);
    const local = new w.BMap.LocalSearch(point, {
      onSearchComplete: (res: any) => {
        // const rawList = res.nk
        setSearching(false);
        if (!res) {
          console.warn('搜索结果为空对象');
          return;
        }

        // 百度地图API有时返回的状态码不是0也可能有结果
        // getStatus(): 0: BMAP_STATUS_SUCCESS
        // const status = res.getStatus();
        // if (status !== 0) {
        //   console.warn('搜索状态码非成功，尝试继续读取结果:', status);
        // }

        const currentCount = typeof res.getCurrentNumPois === 'function' ? res.getCurrentNumPois() : 0;
        const totalCount = typeof res.getNumPois === 'function' ? res.getNumPois() : 0;
        const rawList = Array.isArray(res.nk) ? res.nk : Array.isArray(res.wj?.nk) ? res.wj.nk : [];
        const count = currentCount || totalCount || rawList.length;




        const results: Array<{ title: string; address: string; point: any }> = [];
        const getPoi = (idx: number) => {
          if (typeof res.getPoi === 'function') {
            return res.getPoi(idx);
          }
          if (typeof res.getResults === 'function') {
            const list = res.getResults() || [];
            return list[idx];
          }
          if (rawList.length > 0) {
            return rawList[idx];
          }
          return null;
        };

        for (let i = 0; i < count; i++) {
          const poi = getPoi(i);
          if (!poi) continue;
          const point = poi.point || poi.location || poi.pt || poi.geo;
          if (point) {
            results.push({
              title: poi.title || poi.name || '',
              address: poi.address || poi.addr || '',
              point, // BD09 point
            });
          }
        }

        setSearchResults(results);
        setShowResults(results.length > 0);

        // 恢复原有功能：搜索后自动定位到第一个结果
        if (results.length > 0) {
          const first = results[0];
          const bdLng = first.point.lng;
          const bdLat = first.point.lat;
          const [wgsLng, wgsLat] = bd09towgs84(bdLng, bdLat);

          setCenter({ latitude: bdLat, longitude: bdLng });
          props.onChange?.({ latitude: wgsLat, longitude: wgsLng });

          if (first.address || first.title) {
            const fullAddr = (first.address || '') + ' ' + (first.title || '');
            setResolvedAddress(fullAddr.trim());
            props.onAddressChange?.(fullAddr.trim());
          }
        }
      },
    });

    local.search(keyword);
  };

  const handleSelectPoi = (poi: any) => {
    if (!poi || !poi.point) return;
    const bdLng = poi.point.lng;
    const bdLat = poi.point.lat;
    const [wgsLng, wgsLat] = bd09towgs84(bdLng, bdLat);

    setCenter({ latitude: bdLat, longitude: bdLng });
    props.onChange?.({ latitude: wgsLat, longitude: wgsLng });

    const fullAddr = [poi.address, poi.title].filter(Boolean).join(' ').trim();
    if (fullAddr) {
      setResolvedAddress(fullAddr);
      props.onAddressChange?.(fullAddr);
    }

    if (poi.title) {
      setSearchKeyword(poi.title);
    }
    setShowResults(false);
  };

  const MapAny: any = Map;
  const APILoaderAny: any = APILoader;

  const ak = (import.meta.env.VITE_BAIDU_MAP_AK || '') as string;
  console.log('ak', ak);

  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && wrapperRef.current.contains(e.target as Node)) {
        return;
      }
      setShowResults(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div>
      <div className={styles.tip}>进入页面会自动定位，也可以点击地图选点。</div>
      {!ak ? (
        <div className={styles.warn}>未配置百度地图 AK（VITE_BAIDU_MAP_AK），地图瓦片会加载失败。</div>
      ) : (
        <div className={styles.akInfo}>已读取 AK（长度：{ak.length}）</div>
      )}

      <div className={styles.searchWrapper} ref={wrapperRef}>
        <div className={styles.searchRow}>
          <Input
            value={searchKeyword}
            onChange={(e) => {
              setSearchKeyword(e.target.value);
              if (!e.target.value) {
                setShowResults(false);
              }
            }}
            onPressEnter={onSearchAddress}
            placeholder="搜索地址或地标"
            className={styles.searchInput}
          />
          <Button onClick={onSearchAddress} loading={searching} type="primary">
            搜索
          </Button>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className={styles.resultList}>
            {searchResults.map((item, index) => (
              <div
                key={index}
                className={styles.resultItem}
                onClick={() => handleSelectPoi(item)}
              >
                <div className={styles.itemTitle}>{item.title}</div>
                <div className={styles.itemAddress}>{item.address}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <APILoaderAny akay={ak}>
        <MapAny
          className={styles.map}
          style={{ height, width: '100%' }}
          zoom={15}
          enableScrollWheelZoom
          center={mapCenter}
          onClick={onMapClick}
        >
          {center && <Marker position={{ lng: center.longitude, lat: center.latitude }} />}
        </MapAny>
      </APILoaderAny>
      <Space className={styles.actions}>
        <Button onClick={onAutoAddress}>自动生成地址</Button>
        <Tooltip title="定位当前位置">
          <Button icon={<AimOutlined />} onClick={handleLocation} loading={locationLoading} />
        </Tooltip>
        {resolvedAddress ? <span className={styles.address}>生成地址：{resolvedAddress}</span> : null}
      </Space>
    </div>
  );
}
