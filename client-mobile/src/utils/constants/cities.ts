

export interface CityInfo {
  code: string;
  name: string;
  province: string;
  pinyin: string;
  alias?: string[];
}

export const CITIES: CityInfo[] = [
  // 直辖市
  { code: '110100', name: '北京', province: '北京市', pinyin: 'beijing', alias: ['BJ'] },
  { code: '120100', name: '天津', province: '天津市', pinyin: 'tianjin', alias: ['TJ'] },
  { code: '310100', name: '上海', province: '上海市', pinyin: 'shanghai', alias: ['SH'] },
  { code: '500100', name: '重庆', province: '重庆市', pinyin: 'chongqing', alias: ['CQ'] },

  // 广东省
  { code: '440100', name: '广州', province: '广东省', pinyin: 'guangzhou', alias: ['GZ'] },
  { code: '440300', name: '深圳', province: '广东省', pinyin: 'shenzhen', alias: ['SZ'] },
  { code: '440400', name: '珠海', province: '广东省', pinyin: 'zhuhai' },
  { code: '440600', name: '佛山', province: '广东省', pinyin: 'foshan' },
  { code: '441900', name: '东莞', province: '广东省', pinyin: 'dongguan' },
  { code: '441300', name: '惠州', province: '广东省', pinyin: 'huizhou' },
  { code: '440700', name: '江门', province: '广东省', pinyin: 'jiangmen' },
  { code: '440500', name: '汕头', province: '广东省', pinyin: 'shantou' },
  { code: '442000', name: '中山', province: '广东省', pinyin: 'zhongshan' },

  // 浙江省
  { code: '330100', name: '杭州', province: '浙江省', pinyin: 'hangzhou', alias: ['HZ'] },
  { code: '330200', name: '宁波', province: '浙江省', pinyin: 'ningbo', alias: ['NB'] },
  { code: '330300', name: '温州', province: '浙江省', pinyin: 'wenzhou' },
  { code: '330400', name: '嘉兴', province: '浙江省', pinyin: 'jiaxing' },
  { code: '330500', name: '湖州', province: '浙江省', pinyin: 'huzhou' },
  { code: '330600', name: '绍兴', province: '浙江省', pinyin: 'shaoxing' },
  { code: '330700', name: '金华', province: '浙江省', pinyin: 'jinhua' },
  { code: '331000', name: '台州', province: '浙江省', pinyin: 'taizhou' },

  // 江苏省
  { code: '320100', name: '南京', province: '江苏省', pinyin: 'nanjing', alias: ['NJ'] },
  { code: '320200', name: '无锡', province: '江苏省', pinyin: 'wuxi' },
  { code: '320300', name: '徐州', province: '江苏省', pinyin: 'xuzhou' },
  { code: '320400', name: '常州', province: '江苏省', pinyin: 'changzhou' },
  { code: '320500', name: '苏州', province: '江苏省', pinyin: 'suzhou' },
  { code: '320600', name: '南通', province: '江苏省', pinyin: 'nantong' },
  { code: '321000', name: '扬州', province: '江苏省', pinyin: 'yangzhou' },

  // 四川省
  { code: '510100', name: '成都', province: '四川省', pinyin: 'chengdu', alias: ['CD'] },
  { code: '510700', name: '绵阳', province: '四川省', pinyin: 'mianyang' },
  { code: '511100', name: '乐山', province: '四川省', pinyin: 'leshan' },

  // 湖北省
  { code: '420100', name: '武汉', province: '湖北省', pinyin: 'wuhan', alias: ['WH'] },
  { code: '420500', name: '宜昌', province: '湖北省', pinyin: 'yichang' },
  { code: '420600', name: '襄阳', province: '湖北省', pinyin: 'xiangyang' },

  // 湖南省
  { code: '430100', name: '长沙', province: '湖南省', pinyin: 'changsha', alias: ['CS'] },
  { code: '430200', name: '株洲', province: '湖南省', pinyin: 'zhuzhou' },
  { code: '430600', name: '岳阳', province: '湖南省', pinyin: 'yueyang' },

  // 陕西省
  { code: '610100', name: '西安', province: '陕西省', pinyin: 'xian', alias: ['XA'] },
  { code: '610300', name: '宝鸡', province: '陕西省', pinyin: 'baoji' },

  // 其他省会及重点城市
  { code: '130100', name: '石家庄', province: '河北省', pinyin: 'shijiazhuang' },
  { code: '140100', name: '太原', province: '山西省', pinyin: 'taiyuan' },
  { code: '150100', name: '呼和浩特', province: '内蒙古自治区', pinyin: 'huhehaote' },
  { code: '210100', name: '沈阳', province: '辽宁省', pinyin: 'shenyang' },
  { code: '210200', name: '大连', province: '辽宁省', pinyin: 'dalian' },
  { code: '220100', name: '长春', province: '吉林省', pinyin: 'changchun' },
  { code: '230100', name: '哈尔滨', province: '黑龙江省', pinyin: 'haerbin' },
  { code: '340100', name: '合肥', province: '安徽省', pinyin: 'hefei' },
  { code: '350100', name: '福州', province: '福建省', pinyin: 'fuzhou' },
  { code: '350200', name: '厦门', province: '福建省', pinyin: 'xiamen' },
  { code: '360100', name: '南昌', province: '江西省', pinyin: 'nanchang' },
  { code: '370100', name: '济南', province: '山东省', pinyin: 'jinan' },
  { code: '370200', name: '青岛', province: '山东省', pinyin: 'qingdao' },
  { code: '410100', name: '郑州', province: '河南省', pinyin: 'zhengzhou' },
  { code: '450100', name: '南宁', province: '广西壮族自治区', pinyin: 'nanning' },
  { code: '460100', name: '海口', province: '海南省', pinyin: 'haikou' },
  { code: '460200', name: '三亚', province: '海南省', pinyin: 'sanya' },
  { code: '520100', name: '贵阳', province: '贵州省', pinyin: 'guiyang' },
  { code: '530100', name: '昆明', province: '云南省', pinyin: 'kunming' },
  { code: '540100', name: '拉萨', province: '西藏自治区', pinyin: 'lasa' },
  { code: '620100', name: '兰州', province: '甘肃省', pinyin: 'lanzhou' },
  { code: '630100', name: '西宁', province: '青海省', pinyin: 'xining' },
  { code: '640100', name: '银川', province: '宁夏回族自治区', pinyin: 'yinchuan' },
  { code: '650100', name: '乌鲁木齐', province: '新疆维吾尔自治区', pinyin: 'wulumuqi' },
];


/**
 * 根据城市编码获取城市名称（工具函数）
 */
export function getCityName(code: string): string {
  const city = CITIES.find((c) => c.code === code);
  return city ? city.name : code;
}

/**
 * 根据城市名称获取城市编码（工具函数，用于数据迁移）
 */
export function getCityCode(name: string): string | undefined {
  const city = CITIES.find((c) => c.name === name);
  return city?.code;
}
