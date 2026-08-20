export type AgentEnvelope<T = unknown> = {
  agent: string;
  ok: boolean;
  data?: T;
  outcome?: { key: string; locales?: Record<string, string> };
  skipped?: { provider: string; reason_key: string }[];
  locale?: string;
};

export type PlaceSource = {
  provider: string;
  native_id: string;
  logo_url?: string;
  deeplinks?: Record<string, string>;
};

export const PRICE_LEVELS = ["FREE", "$", "$$", "$$$", "$$$$"] as const;
export type PriceLevel = (typeof PRICE_LEVELS)[number];

export type PlaceCard = {
  provider: string;
  primary_provider?: string;
  name: string;
  address?: string;
  location: { lat: number; lng: number; crs: string };
  rating?: number;
  hours?: string;
  category?: string;
  phone?: string;
  photos?: string[];
  price_level?: PriceLevel;
  price_per_person?: number;
  sources: PlaceSource[];
  tripadvisor?: {
    rating?: number;
    review_count?: number;
    url?: string;
  };
};

export type GeocodeResult = {
  lat: number;
  lng: number;
  crs: string;
  label?: string;
};

export type SearchRestaurantsInput = {
  query?: string;
  near?: { lat: number; lng: number };
  address?: string;
  providers?: string[];
  locale: string;
  enrichTripadvisor?: boolean;
};

export type FitLevel = "strong" | "partial" | "weak";

export type PickDto = {
  id: string;
  provider: string;
  nativeId: string;
  name: string;
  address?: string;
  rating?: number;
  priceLevel?: PriceLevel;
  pricePerPerson?: number;
  photoUrl?: string;
  category?: string;
  fit: FitLevel;
  walkMinutes?: number;
  whyKeys: string[];
  sources: PlaceSource[];
  warnings: string[];
};

export type DecideSearchResponse = {
  searchId: string;
  picks: PickDto[];
  total: number;
  from: number;
  to: number;
  updatedAt: string;
  skipped: { provider: string; reason_key: string }[];
  empty: boolean;
};
