import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type IFilterState, type IHotel, type ICoordinate } from "../types";
import { MOCK_HOTELS } from "./mockData";

// --- 工具函数：计算两点间距离 (km) ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 地球半径 km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1)); // 保留1位小数
}

interface HotelState {
    allHotels: IHotel[]; // 原始完整数据
    filteredHotels: IHotel[]; // 搜索后的展示数据
    // 将筛选条件存在 Redux中，方便列表页回显
    filters: IFilterState;
}

const initialState: HotelState = {
    allHotels: MOCK_HOTELS,
    filteredHotels: MOCK_HOTELS,  // 初始显示所有
    filters: {
        keyword: '',
        minRating: null,
        maxPriceLevel: null,
        selectedTags: []
    }
};

const hotelSlice = createSlice({
    name: 'hotels',
    initialState,
    reducers: {
        // 动作:根据关键词搜索酒店
        setFilters: (state, action: PayloadAction<Partial<IFilterState>>) => {
            state.filters = { ...state.filters, ...action.payload };
        },

        applyFilters: (state, action: PayloadAction<{ currentCity: string; userLoc: ICoordinate | null }>) => {
            const { currentCity, userLoc } = action.payload;
            const { keyword, minRating, maxPriceLevel, selectedTags } = state.filters;

            state.filteredHotels = state.allHotels
                .map(hotel => {
                    if (userLoc) {
                        hotel.distance = calculateDistance(
                            userLoc.latitude, userLoc.longitude,
                            hotel.location.latitude, hotel.location.longitude,
                        );
                    }
                    return hotel;
                })
                .filter(h => {
                    if (h.city != currentCity) return false;

                    if (keyword && !h.name.zh.includes(keyword) && !h.address.includes(keyword)) return false;

                    if (minRating && h.rating < minRating) return false;

                    if (maxPriceLevel && h.priceLevel > maxPriceLevel) return false;

                    if (selectedTags.length > 0) {
                        const hasAllTags = selectedTags.every(tag => h.tags.includes(tag));
                        if (!hasAllTags) return false;
                    }
                    return true;
                });

        },
        sortRestaurants: (state, action: PayloadAction<string>) => {
            const sortType = action.payload;
            state.filteredHotels.sort((a, b) => {
                switch (sortType) {
                    case 'popularity': // 欢迎度 (收藏+评论)
                        return b.favoriteCount - a.favoriteCount;
                    case 'rating': // 评分
                        return b.rating - a.rating;
                    case 'price_low': // 低价优先
                        return a.lowestPrice - b.lowestPrice;
                    case 'price_high': // 高价优先
                        return b.lowestPrice - a.lowestPrice;
                    default:
                        return 0;
                }
            });
        }
    },
});

export const { setFilters, applyFilters,sortRestaurants } = hotelSlice.actions;
export default hotelSlice.reducer;