import * as Location from 'expo-location';

import { CITIES } from './constants/cities';

export interface SupportedLocationCity {
  code: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
}

export type CurrentLocationErrorCode =
  | 'SERVICES_DISABLED'
  | 'PERMISSION_DENIED'
  | 'PERMISSION_BLOCKED'
  | 'POSITION_UNAVAILABLE'
  | 'GEOCODING_UNAVAILABLE'
  | 'UNSUPPORTED_CITY';

export class CurrentLocationError extends Error {
  constructor(
    public readonly code: CurrentLocationErrorCode,
    message: string,
    public readonly placeName?: string,
  ) {
    super(message);
    this.name = 'CurrentLocationError';
  }
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface CurrentSupportedLocation {
  city: SupportedLocationCity;
  coordinates: Coordinate;
  detailName: string;
  country?: string;
  usedNearestCityFallback: boolean;
}

const delay = (milliseconds: number) => (
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds))
);

function normalizePlaceName(value?: string | null) {
  return (value || '')
    .toLocaleLowerCase()
    .replace(/自治州|自治县|特别行政区|地区|盟|市/g, '')
    .replace(/\b(city|municipality|prefecture|shi)\b/g, '')
    .replace(/[^a-z0-9\u3400-\u9fff]/g, '');
}

function findSupportedCityByAddress(
  address: Location.LocationGeocodedAddress,
  supportedCities: SupportedLocationCity[],
) {
  const addressNames = [
    address.city,
    address.subregion,
    address.region,
    address.district,
  ]
    .map(normalizePlaceName)
    .filter(Boolean);

  return supportedCities.find((city) => {
    const cityInfo = CITIES.find((item) => item.code === city.code);
    const supportedNames = [
      city.name,
      cityInfo?.name,
      cityInfo?.pinyin,
      ...(cityInfo?.alias || []).filter((alias) => alias.length > 2),
    ]
      .map(normalizePlaceName)
      .filter(Boolean);

    return addressNames.some((addressName) => (
      supportedNames.some((supportedName) => (
        addressName === supportedName
        || addressName.includes(supportedName)
        || supportedName.includes(addressName)
      ))
    ));
  });
}

function calculateDistanceKm(from: Coordinate, to: Coordinate) {
  const toRadians = (value: number) => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const haversine = (
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(fromLatitude)
    * Math.cos(toLatitude)
    * Math.sin(longitudeDelta / 2) ** 2
  );
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function findNearestSupportedCity(
  coordinates: Coordinate,
  supportedCities: SupportedLocationCity[],
) {
  const nearest = supportedCities
    .filter((city) => city.latitude != null && city.longitude != null)
    .map((city) => ({
      city,
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
    }))
    .filter(({ latitude, longitude }) => (
      Number.isFinite(latitude) && Number.isFinite(longitude)
    ))
    .map(({ city, latitude, longitude }) => ({
      city,
      distanceKm: calculateDistanceKm(coordinates, { latitude, longitude }),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)[0];

  // 酒店坐标平均值只代表城市中心；留出一定范围，但不跨城市做错误兜底。
  return nearest && nearest.distanceKm <= 150 ? nearest.city : undefined;
}

async function reverseGeocodeWithRetry(coordinates: Coordinate) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const addresses = await Location.reverseGeocodeAsync(coordinates);
      if (addresses.length > 0) return addresses;
    } catch (error) {
      lastError = error;
    }
    if (attempt === 0) await delay(400);
  }

  if (lastError) {
    console.warn('逆地理编码失败:', lastError);
  }
  return [];
}

async function getUsablePosition() {
  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      mayShowUserSettingsDialog: true,
    });
  } catch (currentPositionError) {
    const lastKnownPosition = await Location.getLastKnownPositionAsync({
      maxAge: 5 * 60 * 1000,
      requiredAccuracy: 1000,
    });
    if (lastKnownPosition) return lastKnownPosition;

    console.warn('获取当前位置失败:', currentPositionError);
    throw new CurrentLocationError(
      'POSITION_UNAVAILABLE',
      '暂时无法获得当前位置，请到开阔区域后重试',
    );
  }
}

function getAddressPlaceName(address?: Location.LocationGeocodedAddress) {
  return (
    address?.city
    || address?.subregion
    || address?.region
    || address?.district
    || undefined
  );
}

function getAddressDetail(address?: Location.LocationGeocodedAddress) {
  const parts = [
    address?.district,
    address?.name || address?.street,
  ].filter((part): part is string => Boolean(part));
  return Array.from(new Set(parts)).join(' · ');
}

export async function getCurrentSupportedLocation(
  supportedCities: SupportedLocationCity[],
): Promise<CurrentSupportedLocation> {
  if (!await Location.hasServicesEnabledAsync()) {
    throw new CurrentLocationError(
      'SERVICES_DISABLED',
      '系统定位服务尚未开启',
    );
  }

  let permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Location.requestForegroundPermissionsAsync();
  }
  if (!permission.granted) {
    throw new CurrentLocationError(
      permission.canAskAgain ? 'PERMISSION_DENIED' : 'PERMISSION_BLOCKED',
      '没有获得定位权限',
    );
  }

  const position = await getUsablePosition();
  const coordinates = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
  const addresses = await reverseGeocodeWithRetry(coordinates);
  const address = addresses[0];
  const addressMatchedCity = address
    ? findSupportedCityByAddress(address, supportedCities)
    : undefined;
  const nearestCity = addressMatchedCity
    ? undefined
    : findNearestSupportedCity(coordinates, supportedCities);
  const matchedCity = addressMatchedCity || nearestCity;

  if (!matchedCity) {
    const placeName = getAddressPlaceName(address);
    throw new CurrentLocationError(
      address
        ? 'UNSUPPORTED_CITY'
        : 'GEOCODING_UNAVAILABLE',
      address
        ? '当前位置不在酒店服务城市范围内'
        : '已经获得坐标，但暂时无法识别所在城市',
      placeName,
    );
  }

  return {
    city: matchedCity,
    coordinates,
    detailName: getAddressDetail(address),
    country: address?.country || undefined,
    usedNearestCityFallback: !addressMatchedCity,
  };
}
