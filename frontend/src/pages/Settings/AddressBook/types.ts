export interface CustomerAddress {
  id: string;
  full_name: string;
  phone: string;
  region: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
  address: string; // Consolidated string for display
  postal_code: string;
  notes?: string;
  latitude: number;
  longitude: number;
  is_default: boolean;

  // Metadata for "tapat" editing
  street_local?: string;
  regionCode?: string;
  provinceCode?: string;
  municipalityCode?: string;
  barangayCode?: string;
}
