
export interface GeoLocationData {
  latitude: number;
  longitude: number;
  city: string;
  province: string;
  country: string;
  address: string;
  timestamp: string;
  timezone: string;
}

export interface ImageState {
  file: File | null;
  previewUrl: string | null;
  dimensions: { width: number; height: number } | null;
}
