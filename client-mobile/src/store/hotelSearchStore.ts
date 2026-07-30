import { create } from 'zustand';

export interface HotelSearchCity {
  code: string;
  name: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

type StateUpdater<T> = T | ((current: T) => T);

interface HotelSearchState {
  city: HotelSearchCity;
  keyword: string;
  checkIn: string;
  checkOut: string;
  selectedPrice: string;
  selectedStar: string;
  selectedTags: string[];
  setCity: (city: StateUpdater<HotelSearchCity>) => void;
  setKeyword: (keyword: StateUpdater<string>) => void;
  setCheckIn: (checkIn: StateUpdater<string>) => void;
  setCheckOut: (checkOut: StateUpdater<string>) => void;
  setSelectedPrice: (selectedPrice: StateUpdater<string>) => void;
  setSelectedStar: (selectedStar: StateUpdater<string>) => void;
  setSelectedTags: (selectedTags: StateUpdater<string[]>) => void;
}

function resolveUpdater<T>(value: StateUpdater<T>, current: T): T {
  return typeof value === 'function'
    ? (value as (currentValue: T) => T)(current)
    : value;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createInitialDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return {
    checkIn: formatLocalDate(today),
    checkOut: formatLocalDate(tomorrow),
  };
}

const initialDates = createInitialDates();

export function parsePriceLabel(priceLabel: string) {
  if (!priceLabel) {
    return { priceMin: undefined, priceMax: undefined };
  }

  const values = priceLabel.match(/\d+/g)?.map(Number) || [];
  if (priceLabel.includes('以下')) {
    return { priceMin: 0, priceMax: values[0] };
  }
  if (priceLabel.includes('以上')) {
    return { priceMin: values[0], priceMax: undefined };
  }
  return {
    priceMin: values[0],
    priceMax: values[1],
  };
}

export function parseStarLabel(starLabel: string) {
  if (!starLabel) return undefined;
  const numericStar = Number(starLabel.match(/[2-5]/)?.[0]);
  if (Number.isFinite(numericStar)) return numericStar;
  return starLabel.includes('钻') ? 5 : undefined;
}

export const useHotelSearchStore = create<HotelSearchState>((set) => ({
  city: { name: '北京', code: '110100', country: '' },
  keyword: '',
  checkIn: initialDates.checkIn,
  checkOut: initialDates.checkOut,
  selectedPrice: '',
  selectedStar: '',
  selectedTags: [],
  setCity: (city) => set((state) => ({ city: resolveUpdater(city, state.city) })),
  setKeyword: (keyword) => set((state) => ({
    keyword: resolveUpdater(keyword, state.keyword),
  })),
  setCheckIn: (checkIn) => set((state) => ({
    checkIn: resolveUpdater(checkIn, state.checkIn),
  })),
  setCheckOut: (checkOut) => set((state) => ({
    checkOut: resolveUpdater(checkOut, state.checkOut),
  })),
  setSelectedPrice: (selectedPrice) => set((state) => ({
    selectedPrice: resolveUpdater(selectedPrice, state.selectedPrice),
  })),
  setSelectedStar: (selectedStar) => set((state) => ({
    selectedStar: resolveUpdater(selectedStar, state.selectedStar),
  })),
  setSelectedTags: (selectedTags) => set((state) => ({
    selectedTags: resolveUpdater(selectedTags, state.selectedTags),
  })),
}));
