// ─── Shared brand color palette ──────────────────────────────────────────────
// Single source of truth for brand → color across the dashboard, so the same
// brand name renders identically on every tab. Keyed by the exact brand
// strings in the data: CMS `attributed_brand` and VS `pi_brand` / `un_brand` /
// `qs_brand` values.
//
// "Kubota" / "Escorts Kubota" and "Deutz" / "Deutz Fahr" are deliberately
// separate entries until the naming mismatch between the CMS and VS pipelines
// is reconciled.
export const BRAND_COLORS: Record<string, string> = {
  Sonalika: '#EF9F27',
  Mahindra: '#5DCAA5',
  Swaraj: '#85B7EB',
  'John Deere': '#97C459',
  'New Holland': '#AFA9EC',
  'Massey Ferguson': '#F0997B',
  'Escorts Kubota': '#ED93B1',
  Kartar: '#CCC619',
  'Indo Farm': '#59CF7A',
  'Deutz Fahr': '#5CCCD6',
  Preet: '#AA81DA',
  ACE: '#CB7BD5',
  Force: '#DA81BF',
  Solis: '#D65151',
  TAFE: '#B66435',
  Powertrac: '#6D8FE4',
  Farmtrac: '#2E9E8F',
  Eicher: '#E0BC45',
  JCB: '#BC9126',
  VST: '#338FB8',
  Bajaj: '#8065C9',
  Deutz: '#4E9A55',
  Ford: '#4A6FB0',
  Kubota: '#E8734D',
  Lovol: '#A8324F',
  NVT: '#B04A8F',
};

// Neutral grey for any brand name without an assigned color.
export const FALLBACK_BRAND_COLOR = '#9CA3AF';

export const getBrandColor = (brand: string): string =>
  BRAND_COLORS[brand] || FALLBACK_BRAND_COLOR;

// ─── Shared brand exclusion list ─────────────────────────────────────────────
// Names that surface in the raw data (CMS's detected_brands_from_transcript,
// VS's pi_brand/un_brand/qs_brand) but aren't tractor manufacturers in this
// project's competitive set — commercial-vehicle, two-wheeler, or otherwise
// incidental co-mentions in the source transcripts/comments. Both CMS
// (useCMSData.js) and VS (useVSData.js) exclude these from the brand universe
// entirely, reading from this single shared list so the two never drift.
export const EXCLUDED_BRANDS = new Set<string>([
  'Maruti Suzuki',
  'Royal Enfield',
  'Tata',
  'Ultraviolette',
  'Ashok Leyland',
]);
