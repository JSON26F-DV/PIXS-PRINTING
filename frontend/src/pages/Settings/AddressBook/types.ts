export interface CustomerAddress {
  id: string
  adress_label: string
  contact_number: string
  region: string
  province: string
  city: string
  barangay: string
  street: string
  postal_code: string
  is_default: boolean

  // Metadata for "tapat" editing
  regionCode?: string
  provinceCode?: string
  municipalityCode?: string
  barangayCode?: string
}
