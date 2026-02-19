import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type{ IBookingState,ICoordinate } from "../types";

// 获取今天的日期字符串 YYYY-MM-DD
const getTodayStr = () => new Date().toISOString().split('T')[0];

const initialState: IBookingState = {
    city: '上海',
    date: getTodayStr(),// 默认是今天
    time: '18:00',      // 默认晚餐时间
    guestCount: 2,  // 默认预订时间
    userLocation: null,
    selectedHotelId: null
}

const bookingSlice = createSlice({
    name: 'booking',
    initialState,
    reducers: {
        setCity: (state, action: PayloadAction<string>) => {
            state.city = action.payload;
        },
        // 动作：更新预订基础信息
        updateBookingInfo: (state, action: PayloadAction<Partial<IBookingState>>) => {
            // 使用object.assign 或者 spread 来更新状态
            return { ...state, ...action.payload };
        },
        // 动作：选中某家餐厅（进入详情页或点击预订时触发）
        selectHotel: (state, action: PayloadAction<string>) => {
            state.selectedHotelId = action.payload;
        },
        setUserLocation:(state, action : PayloadAction<ICoordinate>) =>{
            state.userLocation = action.payload
        },

        // 动作：清空预订信息（下单成功后）
        resetBooking: () => initialState
    },
});

export const { updateBookingInfo, selectHotel, resetBooking, setCity, setUserLocation } = bookingSlice.actions;
export default bookingSlice.reducer;
