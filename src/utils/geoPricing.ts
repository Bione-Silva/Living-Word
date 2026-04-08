export type GeoRegion = 'BRL' | 'USD' | 'LATAM' | 'TEST';

interface PlanPrice {
  id: string;
  amount: number;
}

interface RegionPricing {
  currency: string;
  symbol: string;
  plans: {
    starter: PlanPrice;
    pro: PlanPrice;
    igreja: PlanPrice;
  };
  annual: {
    starter: PlanPrice;
    pro: PlanPrice;
    igreja: PlanPrice;
  };
  addon_topup: PlanPrice;
}

export const PRICING_MAP: Record<GeoRegion, RegionPricing> = {
  BRL: {
    currency: 'BRL',
    symbol: 'R$',
    plans: {
      starter: { id: 'price_1TJg0mEaDBbHafP6EjCuGgmk', amount: 37.00 },
      pro:     { id: 'price_1TJg0oEaDBbHafP6bC747uSG', amount: 79.00 },
      igreja:  { id: 'price_1TJg0qEaDBbHafP6gyw9BqQ1', amount: 197.00 },
    },
    annual: {
      starter: { id: 'price_1TJg0nEaDBbHafP6R0XrOxCo', amount: 370.00 },
      pro:     { id: 'price_1TJg0pEaDBbHafP6ToL24iXI', amount: 790.00 },
      igreja:  { id: 'price_1TJg0rEaDBbHafP69yZFNvtc', amount: 1970.00 },
    },
    addon_topup: { id: 'price_1TJl2SEaDBbHafP6pmEHdFEq', amount: 39.90 },
  },
  USD: {
    currency: 'USD',
    symbol: '$',
    plans: {
      starter: { id: 'price_1TJg2MEaDBbHafP6XJj9s3F9', amount: 9.90 },
      pro:     { id: 'price_1TJg2OEaDBbHafP61mI4YwO1', amount: 29.90 },
      igreja:  { id: 'price_1TJg2PEaDBbHafP6K9X4N4C4', amount: 79.90 },
    },
    annual: {
      starter: { id: 'price_1TJg2NEaDBbHafP6L5R5s5X5', amount: 99.00 },
      pro:     { id: 'price_1TJg2OEaDBbHafP6yyyyyyy2', amount: 299.00 },
      igreja:  { id: 'price_1TJg2QEaDBbHafP6zzzzzzz3', amount: 799.00 },
    },
    addon_topup: { id: 'price_1TJl2TEaDBbHafP6X6urHSkN', amount: 9.90 },
  },
  LATAM: {
    currency: 'USD',
    symbol: '$',
    plans: {
      starter: { id: 'price_1TIbCrEaDBbHafP6gO6Z5UPt', amount: 5.90 },
      pro:     { id: 'price_1TIbCsEaDBbHafP6kY9apvOc', amount: 19.00 },
      igreja:  { id: 'price_1TIbCtEaDBbHafP6Rh4uTD5Q', amount: 49.00 },
    },
    annual: {
      starter: { id: 'price_1TIbCrEaDBbHafP6gO6Z5UPt', amount: 59.00 },
      pro:     { id: 'price_1TIbCsEaDBbHafP6kY9apvOc', amount: 190.00 },
      igreja:  { id: 'price_1TIbCtEaDBbHafP6Rh4uTD5Q', amount: 490.00 },
    },
    addon_topup: { id: 'price_1TIbCvEaDBbHafP6DM4entar', amount: 3.90 },
  },
  TEST: {
    currency: 'USD',
    symbol: '$',
    plans: {
      starter: { id: 'price_1TIbCrEaDBbHafP6dRTQO3m2', amount: 1.00 },
      pro:     { id: 'price_1TIbCsEaDBbHafP6ximO1Myd', amount: 1.00 },
      igreja:  { id: 'price_1TIbCuEaDBbHafP6RlbFZvJH', amount: 1.00 },
    },
    annual: {
      starter: { id: 'price_1TIbCrEaDBbHafP6dRTQO3m2', amount: 10.00 },
      pro:     { id: 'price_1TIbCsEaDBbHafP6ximO1Myd', amount: 10.00 },
      igreja:  { id: 'price_1TIbCuEaDBbHafP6RlbFZvJH', amount: 10.00 },
    },
    addon_topup: { id: 'price_1TIbCvEaDBbHafP6WaieVawh', amount: 1.00 },
  },
};

const LATAM_COUNTRIES = [
  'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV',
  'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE',
];

/** Timezone-based fallback (sync, no network) */
function detectByTimezone(): GeoRegion {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (
      tz.includes('Sao_Paulo') || tz.includes('Fortaleza') || tz.includes('Recife') ||
      tz.includes('Bahia') || tz.includes('Belem') || tz.includes('Manaus') ||
      tz.includes('Cuiaba') || tz.includes('Campo_Grande') || tz.includes('Maceio')
    ) return 'BRL';
    if (
      tz.includes('Buenos_Aires') || tz.includes('Santiago') || tz.includes('Bogota') ||
      tz.includes('Lima') || tz.includes('Mexico_City') || tz.includes('Caracas') ||
      tz.includes('Montevideo') || tz.includes('Asuncion') || tz.includes('Guayaquil')
    ) return 'LATAM';
  } catch { /* ignore */ }
  return 'USD';
}

/** Primary: IP-based detection via ipapi.co, fallback: timezone */
export async function detectUserRegion(): Promise<GeoRegion> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);

    const data = await response.json();

    if (data.country === 'BR') return 'BRL';
    if (LATAM_COUNTRIES.includes(data.country)) return 'LATAM';
    return 'USD';
  } catch {
    return detectByTimezone();
  }
}

/** @deprecated Use detectUserRegion() instead */
export function detectGeoRegion(): GeoRegion {
  return detectByTimezone();
}

export function formatPrice(amount: number, symbol: string, currency: string): string {
  if (currency === 'BRL') {
    return `${symbol}\u00A0${amount.toFixed(2).replace('.', ',')}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
}
