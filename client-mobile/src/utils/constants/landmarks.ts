// src/constants/landmarks.ts

export interface LandmarkValue {
  latitude: number;
  longitude: number;
  id: string;
}

export interface LandmarkOption {
  label: string;
  value: LandmarkValue;
  description?: string; // 可选，用于展示副标题
}

export const LANDMARK_OPTIONS: LandmarkOption[] = [
  // --- 热门商圈 ---
  {
    label: '江南环球港',
    value: { id: 'mall-1', latitude: 31.8350, longitude: 119.9900 },
    description: '新北区 | 超大商业体/摩天轮',
  },
  {
    label: '常州购物中心',
    value: { id: 'mall-2', latitude: 31.7820, longitude: 119.9550 },
    description: '市中心 | 奢侈品/高端百货',
  },
  {
    label: '南大街步行街',
    value: { id: 'mall-3', latitude: 31.7819, longitude: 119.9485 },
    description: '市中心 | 繁华商业街',
  },
  {
    label: '武进吾悦广场',
    value: { id: 'mall-4', latitude: 31.7050, longitude: 119.9500 },
    description: '武进区 | 热门综合体',
  },

  // --- 必玩景点 ---
  {
    label: '中华恐龙园',
    value: { id: 'spot-1', latitude: 31.8240, longitude: 120.0008 },
    description: '5A景区 | 恐龙主题乐园',
  },
  {
    label: '淹城春秋乐园',
    value: { id: 'spot-2', latitude: 31.7250, longitude: 119.9450 },
    description: '武进区 | 春秋文化遗址',
  },
  {
    label: '天宁寺',
    value: { id: 'spot-3', latitude: 31.7796, longitude: 119.9750 },
    description: '天宁区 | 世界最高佛塔',
  },
  {
    label: '青果巷',
    value: { id: 'spot-4', latitude: 31.7722, longitude: 119.9597 },
    description: '历史街区 | 江南名士第一巷',
  },
  {
    label: '红梅公园',
    value: { id: 'spot-5', latitude: 31.7850, longitude: 119.9800 },
    description: '综合公园 | 赏梅胜地',
  },

  // --- 交通枢纽 ---
  {
    label: '常州北站 (高铁)',
    value: { id: 'trans-1', latitude: 31.8560, longitude: 119.9506 },
    description: '新北区 | 京沪高铁',
  },
  {
    label: '常州火车站',
    value: { id: 'trans-2', latitude: 31.7900, longitude: 119.9800 },
    description: '天宁区 | 老火车站',
  },
];