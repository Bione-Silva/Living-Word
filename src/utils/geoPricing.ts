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
    church: PlanPrice;
  };
  addon: PlanPrice;
}

export const PRICING_MAP: Record<GeoRegion, RegionPricing> = {
  BRL: {
    currency: 'BRL',
    symbol: 'R$',
    plans: {
      starter: { id: 'price_1TIbCqEaDBbHafP6rVx4M0iq', amount: 19.00 },
      pro: { id: 'price_1TIbCsEaDBbHafP6jMjpjCWF', amount: 49.00 },
      church: { id: 'price_1TIbCtEaDBbHafP6dIYl8Fjg', amount: 97.00 },
    },
    addon: { id: 'price_1TIbCuEaDBbHafP6fQWCkE7l', amount: 9.00 },
  },
  USD: {
    currency: 'USD',
    symbol: '$',
    plans: {
      starter: { id: 'price_1TIbCqEaDBbHafP6AqYI1lQ3', amount: 9.90 },
      pro: { id: 'price_1TIbCsEaDBbHafP6qOWGnzjp', amount: 29.90 },
      church: { id: 'price_1TIbCtEaDBbHafP6D1krnMzA', amount: 79.90 },
    },
    addon: { id: 'price_1TIbCuEaDBbHafP6FhfTaKnh', amount: 5.90 },
  },
  LATAM: {
    currency: 'USD',
    symbol: '$',
    plans: {
      starter: { id: 'price_1TIbCrEaDBbHafP6gO6Z5UPt', amount: 5.90 },
      pro: { id: 'price_1TIbCsEaDBbHafP6kY9apvOc', amount: 19.00 },
      church: { id: 'price_1TIbCtEaDBbHafP6Rh4uTD5Q', amount: 49.00 },
    },
    addon: { id: 'price_1TIbCvEaDBbHafP6DM4entar', amount: 3.90 },
  },
  TEST: {
    currency: 'USD',
    symbol: '$',
    plans: {
      starter: { id: 'price_1TIbCrEaDBbHafP6dRTQO3m2', amount: 1.00 },
      pro: { id: 'price_1TIbCsEaDBbHafP6ximO1Myd', amount: 1.00 },
      church: { id: 'price_1TIbCuEaDBbHafP6RlbFZvJH', amount: 1.00 },
    },
    addon: { id: 'price_1TIbCvEaDBbHafP6WaieVawh', amount: 1.00 },
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
