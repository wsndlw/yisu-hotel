import { type IHotel } from "../types";

export const MOCK_HOTELS: IHotel[] = [
    {
        id: '1',
        name: {
            zh: '梦果智慧酒店(上海浦东机场晚霞路店)', // 中文名
            en: '' // 英文名
        },
        city: '上海', // 所属城市
        location: { latitude: 39.9042, longitude: 116.4074 }, // 经纬度
        coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', // 对应 public 目录下的路径，例如 "/images/r1.jpg"
        address: '上海市浦东新区祝桥镇晚霞路661-667号',
        rating: 4, // 0 - 5
        tags: ['免费停车', '智能客控', '复式loft房'], // ["亲子", "免费停车", "豪华"...]
        priceLevel: 2, // 价格等级，越多越贵
        description: '配备接送机服务,全智能语音操控',
        signatureRooms: [
            { name: '特惠房', price: 167 },
            { name: '智能LOFT大床房', price: 179 }
        ], // 特色菜品列表// 评分人数
        reviewCount: 2304,
        favoriteCount: 5600,  // 收藏人数
        lowestPrice: 168, // 最低房间价格
        nearbyLabel: '近天安门广场·故宫',
        commentLabel: '超棒',
        rankLabel: '北京景观酒店榜 No.1',

    },

]