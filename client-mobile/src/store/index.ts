import { configureStore } from "@reduxjs/toolkit";
import hotelReducer from './hotelSlice';
import bookingReducer from './bookingSlice';

export const store = configureStore({
    reducer:{
        hotel: hotelReducer,
        booking:bookingReducer
    },
});

// ---typescript 类型定义---
// 从store 本身推断出 RootState和AppDispatch 
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;