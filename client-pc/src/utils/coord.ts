// ==========================================
// 坐标转换算法 (WGS84 <-> BD09)
// ==========================================
const PI = 3.1415926535897932384626;
const x_pi = (3.14159265358979324 * 3000.0) / 180.0;
const a = 6378245.0;
const ee = 0.00669342162296594323;

function transformLat(x: number, y: number) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLon(x: number, y: number) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0) / 3.0;
  return ret;
}

// WGS84 转 GCJ02
function wgs84togcj02(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) {
    return [lng, lat];
  }
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLon = transformLon(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  const magic = Math.sin(radLat);
  const sqrtMagic = Math.sqrt(1.0 - ee * magic * magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  const mgLat = lat + dLat;
  const mgLng = lng + dLon;
  return [mgLng, mgLat];
}

// GCJ02 转 BD09
function gcj02tobd09(lng: number, lat: number): [number, number] {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_pi);
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_pi);
  const bd_lng = z * Math.cos(theta) + 0.0065;
  const bd_lat = z * Math.sin(theta) + 0.006;
  return [bd_lng, bd_lat];
}

// BD09 转 GCJ02
function bd09togcj02(bd_lon: number, bd_lat: number): [number, number] {
  const x = bd_lon - 0.0065;
  const y = bd_lat - 0.006;
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
  const gg_lng = z * Math.cos(theta);
  const gg_lat = z * Math.sin(theta);
  return [gg_lng, gg_lat];
}

// GCJ02 转 WGS84
function gcj02towgs84(lng: number, lat: number): [number, number] {
  if (outOfChina(lng, lat)) {
    return [lng, lat];
  }
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLon = transformLon(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * PI;
  const magic = Math.sin(radLat);
  const sqrtMagic = Math.sqrt(1.0 - ee * magic * magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  const mgLat = lat + dLat;
  const mgLng = lng + dLon;
  return [lng * 2 - mgLng, lat * 2 - mgLat];
}

function outOfChina(lng: number, lat: number) {
  return (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271);
}

// 组合转换：WGS84 -> BD09
export function wgs84tobd09(lng: number, lat: number): [number, number] {
  const [gcjLng, gcjLat] = wgs84togcj02(lng, lat);
  return gcj02tobd09(gcjLng, gcjLat);
}

// 组合转换：BD09 -> WGS84
export function bd09towgs84(lng: number, lat: number): [number, number] {
  const [gcjLng, gcjLat] = bd09togcj02(lng, lat);
  return gcj02towgs84(gcjLng, gcjLat);
}
