import { create } from 'zustand';

export interface BookingCity {
  code: string;
  name: string;
  country?: string;
}

export interface SelectedHotel {
  id: string;
  name: string;
  address?: string | null;
  imageUrl?: string | null;
}

export interface SelectedRoom {
  id: string;
  name: string;
  price: number;
  maxGuests?: number | null;
}

interface BookingData {
  city: BookingCity;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  selectedHotel: SelectedHotel | null;
  selectedRoom: SelectedRoom | null;
}

interface BookingState extends BookingData {
  setCity: (city: BookingCity) => void;
  setDates: (checkIn: string, checkOut: string) => void;
  setGuestCount: (guestCount: number) => void;
  selectHotel: (hotel: SelectedHotel | null) => void;
  selectRoom: (room: SelectedRoom | null) => void;
  updateBooking: (booking: Partial<BookingData>) => void;
  resetBooking: () => void;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createInitialBooking(): BookingData {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  return {
    city: { code: '110100', name: '北京', country: '' },
    checkIn: formatDate(today),
    checkOut: formatDate(tomorrow),
    guestCount: 1,
    selectedHotel: null,
    selectedRoom: null,
  };
}

export const useBookingStore = create<BookingState>((set) => ({
  ...createInitialBooking(),
  setCity: (city) => set({ city }),
  setDates: (checkIn, checkOut) => set({ checkIn, checkOut }),
  setGuestCount: (guestCount) => set({ guestCount: Math.max(1, Math.trunc(guestCount)) }),
  selectHotel: (selectedHotel) => set({ selectedHotel }),
  selectRoom: (selectedRoom) => set({ selectedRoom }),
  updateBooking: (booking) => set(booking),
  resetBooking: () => set(createInitialBooking()),
}));
