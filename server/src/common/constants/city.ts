

export interface CityInfo {
  code: string; // 城市编码（6位）
  name: string; // 城市名称
  province: string; // 省份
  pinyin: string; // 拼音
  alias?: string[]; 
}


// 主要城市列表

export const CITIES: CityInfo[] = [
  // 直辖市
  { code: '110100', name: '北京', province: '北京市', pinyin: 'beijing', alias: ['BJ'] },
  { code: '120100', name: '天津', province: '天津市', pinyin: 'tianjin', alias: ['TJ'] },
  { code: '310100', name: '上海', province: '上海市', pinyin: 'shanghai', alias: ['SH'] },
  { code: '500100', name: '重庆', province: '重庆市', pinyin: 'chongqing', alias: ['CQ'] },

  // 广东省
  { code: '440100', name: '广州', province: '广东省', pinyin: 'guangzhou', alias: ['GZ'] },
  { code: '440300', name: '深圳', province: '广东省', pinyin: 'shenzhen', alias: ['SZ'] },
  { code: '440400', name: '珠海', province: '广东省', pinyin: 'zhuhai', alias: [] },
  { code: '440600', name: '佛山', province: '广东省', pinyin: 'foshan', alias: [] },
  { code: '441900', name: '东莞', province: '广东省', pinyin: 'dongguan', alias: [] },
  { code: '441300', name: '惠州', province: '广东省', pinyin: 'huizhou', alias: [] },
  { code: '440700', name: '江门', province: '广东省', pinyin: 'jiangmen', alias: [] },
  { code: '440200', name: '韶关', province: '广东省', pinyin: 'shaoguan', alias: [] },
  { code: '440500', name: '汕头', province: '广东省', pinyin: 'shantou', alias: [] },
  { code: '441500', name: '汕尾', province: '广东省', pinyin: 'shanwei', alias: [] },
  { code: '440800', name: '湛江', province: '广东省', pinyin: 'zhanjiang', alias: [] },
  { code: '440900', name: '茂名', province: '广东省', pinyin: 'maoming', alias: [] },
  { code: '441200', name: '肇庆', province: '广东省', pinyin: 'zhaoqing', alias: [] },
  { code: '441400', name: '梅州', province: '广东省', pinyin: 'meizhou', alias: [] },
  { code: '441600', name: '河源', province: '广东省', pinyin: 'heyuan', alias: [] },
  { code: '441700', name: '阳江', province: '广东省', pinyin: 'yangjiang', alias: [] },
  { code: '441800', name: '清远', province: '广东省', pinyin: 'qingyuan', alias: [] },
  { code: '445100', name: '潮州', province: '广东省', pinyin: 'chaozhou', alias: [] },
  { code: '445200', name: '揭阳', province: '广东省', pinyin: 'jieyang', alias: [] },
  { code: '445300', name: '云浮', province: '广东省', pinyin: 'yunfu', alias: [] },
  { code: '442000', name: '中山', province: '广东省', pinyin: 'zhongshan', alias: [] },

  // 浙江省
  { code: '330100', name: '杭州', province: '浙江省', pinyin: 'hangzhou', alias: ['HZ'] },
  { code: '330200', name: '宁波', province: '浙江省', pinyin: 'ningbo', alias: ['NB'] },
  { code: '330300', name: '温州', province: '浙江省', pinyin: 'wenzhou', alias: [] },
  { code: '330400', name: '嘉兴', province: '浙江省', pinyin: 'jiaxing', alias: [] },
  { code: '330500', name: '湖州', province: '浙江省', pinyin: 'huzhou', alias: [] },
  { code: '330600', name: '绍兴', province: '浙江省', pinyin: 'shaoxing', alias: [] },
  { code: '330700', name: '金华', province: '浙江省', pinyin: 'jinhua', alias: [] },
  { code: '330800', name: '衢州', province: '浙江省', pinyin: 'quzhou', alias: [] },
  { code: '330900', name: '舟山', province: '浙江省', pinyin: 'zhoushan', alias: [] },
  { code: '331000', name: '台州', province: '浙江省', pinyin: 'taizhou', alias: [] },
  { code: '331100', name: '丽水', province: '浙江省', pinyin: 'lishui', alias: [] },

  // 江苏省
  { code: '320100', name: '南京', province: '江苏省', pinyin: 'nanjing', alias: ['NJ'] },
  { code: '320200', name: '无锡', province: '江苏省', pinyin: 'wuxi', alias: [] },
  { code: '320300', name: '徐州', province: '江苏省', pinyin: 'xuzhou', alias: [] },
  { code: '320400', name: '常州', province: '江苏省', pinyin: 'changzhou', alias: [] },
  { code: '320500', name: '苏州', province: '江苏省', pinyin: 'suzhou', alias: ['SZ'] },
  { code: '320600', name: '南通', province: '江苏省', pinyin: 'nantong', alias: [] },
  { code: '320700', name: '连云港', province: '江苏省', pinyin: 'lianyungang', alias: [] },
  { code: '320800', name: '淮安', province: '江苏省', pinyin: 'huaian', alias: [] },
  { code: '320900', name: '盐城', province: '江苏省', pinyin: 'yancheng', alias: [] },
  { code: '321000', name: '扬州', province: '江苏省', pinyin: 'yangzhou', alias: [] },
  { code: '321100', name: '镇江', province: '江苏省', pinyin: 'zhenjiang', alias: [] },
  { code: '321200', name: '泰州', province: '江苏省', pinyin: 'taizhou', alias: [] },
  { code: '321300', name: '宿迁', province: '江苏省', pinyin: 'suqian', alias: [] },

  // 四川省
  { code: '510100', name: '成都', province: '四川省', pinyin: 'chengdu', alias: ['CD'] },
  { code: '510300', name: '自贡', province: '四川省', pinyin: 'zigong', alias: [] },
  { code: '510400', name: '攀枝花', province: '四川省', pinyin: 'panzhihua', alias: [] },
  { code: '510500', name: '泸州', province: '四川省', pinyin: 'luzhou', alias: [] },
  { code: '510600', name: '德阳', province: '四川省', pinyin: 'deyang', alias: [] },
  { code: '510700', name: '绵阳', province: '四川省', pinyin: 'mianyang', alias: [] },
  { code: '510800', name: '广元', province: '四川省', pinyin: 'guangyuan', alias: [] },
  { code: '510900', name: '遂宁', province: '四川省', pinyin: 'suining', alias: [] },
  { code: '511000', name: '内江', province: '四川省', pinyin: 'neijiang', alias: [] },
  { code: '511100', name: '乐山', province: '四川省', pinyin: 'leshan', alias: [] },
  { code: '511300', name: '南充', province: '四川省', pinyin: 'nanchong', alias: [] },
  { code: '511400', name: '眉山', province: '四川省', pinyin: 'meishan', alias: [] },
  { code: '511500', name: '宜宾', province: '四川省', pinyin: 'yibin', alias: [] },
  { code: '511600', name: '广安', province: '四川省', pinyin: 'guangan', alias: [] },
  { code: '511700', name: '达州', province: '四川省', pinyin: 'dazhou', alias: [] },
  { code: '511800', name: '雅安', province: '四川省', pinyin: 'yaan', alias: [] },
  { code: '511900', name: '巴中', province: '四川省', pinyin: 'bazhong', alias: [] },
  { code: '512000', name: '资阳', province: '四川省', pinyin: 'ziyang', alias: [] },

  // 湖北省
  { code: '420100', name: '武汉', province: '湖北省', pinyin: 'wuhan', alias: ['WH'] },
  { code: '420200', name: '黄石', province: '湖北省', pinyin: 'huangshi', alias: [] },
  { code: '420300', name: '十堰', province: '湖北省', pinyin: 'shiyan', alias: [] },
  { code: '420500', name: '宜昌', province: '湖北省', pinyin: 'yichang', alias: [] },
  { code: '420600', name: '襄阳', province: '湖北省', pinyin: 'xiangyang', alias: [] },
  { code: '420700', name: '鄂州', province: '湖北省', pinyin: 'ezhou', alias: [] },
  { code: '420800', name: '荆门', province: '湖北省', pinyin: 'jingmen', alias: [] },
  { code: '420900', name: '孝感', province: '湖北省', pinyin: 'xiaogan', alias: [] },
  { code: '421000', name: '荆州', province: '湖北省', pinyin: 'jingzhou', alias: [] },
  { code: '421100', name: '黄冈', province: '湖北省', pinyin: 'huanggang', alias: [] },
  { code: '421200', name: '咸宁', province: '湖北省', pinyin: 'xianning', alias: [] },
  { code: '421300', name: '随州', province: '湖北省', pinyin: 'suizhou', alias: [] },

  // 湖南省
  { code: '430100', name: '长沙', province: '湖南省', pinyin: 'changsha', alias: ['CS'] },
  { code: '430200', name: '株洲', province: '湖南省', pinyin: 'zhuzhou', alias: [] },
  { code: '430300', name: '湘潭', province: '湖南省', pinyin: 'xiangtan', alias: [] },
  { code: '430400', name: '衡阳', province: '湖南省', pinyin: 'hengyang', alias: [] },
  { code: '430500', name: '邵阳', province: '湖南省', pinyin: 'shaoyang', alias: [] },
  { code: '430600', name: '岳阳', province: '湖南省', pinyin: 'yueyang', alias: [] },
  { code: '430700', name: '常德', province: '湖南省', pinyin: 'changde', alias: [] },
  { code: '430800', name: '张家界', province: '湖南省', pinyin: 'zhangjiajie', alias: [] },
  { code: '430900', name: '益阳', province: '湖南省', pinyin: 'yiyang', alias: [] },
  { code: '431000', name: '郴州', province: '湖南省', pinyin: 'chenzhou', alias: [] },
  { code: '431100', name: '永州', province: '湖南省', pinyin: 'yongzhou', alias: [] },
  { code: '431200', name: '怀化', province: '湖南省', pinyin: 'huaihua', alias: [] },
  { code: '431300', name: '娄底', province: '湖南省', pinyin: 'loudi', alias: [] },

  // 陕西省
  { code: '610100', name: '西安', province: '陕西省', pinyin: 'xian', alias: ['XA'] },
  { code: '610200', name: '铜川', province: '陕西省', pinyin: 'tongchuan', alias: [] },
  { code: '610300', name: '宝鸡', province: '陕西省', pinyin: 'baoji', alias: [] },
  { code: '610400', name: '咸阳', province: '陕西省', pinyin: 'xianyang', alias: [] },
  { code: '610500', name: '渭南', province: '陕西省', pinyin: 'weinan', alias: [] },
  { code: '610600', name: '延安', province: '陕西省', pinyin: 'yanan', alias: [] },
  { code: '610700', name: '汉中', province: '陕西省', pinyin: 'hanzhong', alias: [] },
  { code: '610800', name: '榆林', province: '陕西省', pinyin: 'yulin', alias: [] },
  { code: '610900', name: '安康', province: '陕西省', pinyin: 'ankang', alias: [] },
  { code: '611000', name: '商洛', province: '陕西省', pinyin: 'shangluo', alias: [] },

  // 其他省会及重点城市
  { code: '130100', name: '石家庄', province: '河北省', pinyin: 'shijiazhuang', alias: [] },
  { code: '140100', name: '太原', province: '山西省', pinyin: 'taiyuan', alias: [] },
  { code: '150100', name: '呼和浩特', province: '内蒙古自治区', pinyin: 'huhehaote', alias: [] },
  { code: '210100', name: '沈阳', province: '辽宁省', pinyin: 'shenyang', alias: [] },
  { code: '210200', name: '大连', province: '辽宁省', pinyin: 'dalian', alias: [] },
  { code: '220100', name: '长春', province: '吉林省', pinyin: 'changchun', alias: [] },
  { code: '230100', name: '哈尔滨', province: '黑龙江省', pinyin: 'haerbin', alias: [] },
  { code: '340100', name: '合肥', province: '安徽省', pinyin: 'hefei', alias: [] },
  { code: '350100', name: '福州', province: '福建省', pinyin: 'fuzhou', alias: [] },
  { code: '350200', name: '厦门', province: '福建省', pinyin: 'xiamen', alias: [] },
  { code: '360100', name: '南昌', province: '江西省', pinyin: 'nanchang', alias: [] },
  { code: '370100', name: '济南', province: '山东省', pinyin: 'jinan', alias: [] },
  { code: '370200', name: '青岛', province: '山东省', pinyin: 'qingdao', alias: [] },
  { code: '410100', name: '郑州', province: '河南省', pinyin: 'zhengzhou', alias: [] },
  { code: '450100', name: '南宁', province: '广西壮族自治区', pinyin: 'nanning', alias: [] },
  { code: '460100', name: '海口', province: '海南省', pinyin: 'haikou', alias: [] },
  { code: '460200', name: '三亚', province: '海南省', pinyin: 'sanya', alias: [] },
  { code: '520100', name: '贵阳', province: '贵州省', pinyin: 'guiyang', alias: [] },
  { code: '530100', name: '昆明', province: '云南省', pinyin: 'kunming', alias: [] },
  { code: '540100', name: '拉萨', province: '西藏自治区', pinyin: 'lasa', alias: [] },
  { code: '610100', name: '西安', province: '陕西省', pinyin: 'xian', alias: [] },
  { code: '620100', name: '兰州', province: '甘肃省', pinyin: 'lanzhou', alias: [] },
  { code: '630100', name: '西宁', province: '青海省', pinyin: 'xining', alias: [] },
  { code: '640100', name: '银川', province: '宁夏回族自治区', pinyin: 'yinchuan', alias: [] },
  { code: '650100', name: '乌鲁木齐', province: '新疆维吾尔自治区', pinyin: 'wulumuqi', alias: [] },
];


//根据编码获取城市
export function getCityByCode(code: string): CityInfo | undefined {
  return CITIES.find((c) => c.code === code);
}

//根据城市名获取城市
export function getCityByName(name: string): CityInfo | undefined {
  return CITIES.find((c) => c.name === name);
}


//搜索城市

export function searchCities(keyword: string): CityInfo[] {
  if (!keyword) return CITIES;
  
  const lowerKeyword = keyword.toLowerCase();
  return CITIES.filter((city) => {
    return (
      city.name.includes(keyword) ||
      city.pinyin.includes(lowerKeyword) ||
      city.province.includes(keyword) ||
      (city.alias && city.alias.some((a) => a.toLowerCase().includes(lowerKeyword)))
    );
  });
}
