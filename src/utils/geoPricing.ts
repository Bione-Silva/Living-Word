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

const LATAM_TIMEZONES = [
  'America/Argentina', 'America/Bogota', 'America/Lima', 'America/Santiago',
  'America/Mexico_City', 'America/Caracas', 'America/Guayaquil', 'America/Montevideo',
  'America/Asuncion', 'America/La_Paz', 'America/Panama', 'America/Guatemala',
  'America/Tegucigalpa', 'America/Managua', 'America/San_Jose', 'America/Havana',
  'America/Santo_Domingo', 'America/Port-au-Prince',
];

const BRAZIL_TIMEZONES = [
  'America/Sao_Paulo', 'America/Fortaleza', 'America/Recife', 'America/Bahia',
  'America/Belem', 'America/Manaus', 'America/Cuiaba', 'America/Porto_Velho',
  'America/Boa_Vista', 'America/Campo_Grande', 'America/Rio_Branco',
  'America/Araguaina', 'America/Maceio', 'America/Noronha',
];

export function detectGeoRegion(): GeoRegion {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (BRAZIL_TIMEZONES.some((btz) => tz.startsWith(btz))) {
      return 'BRL';
    }

    if (LATAM_TIMEZONES.some((ltz) => tz.startsWith(ltz))) {
      return 'LATAM';
    }

    // Check language as secondary signal
    const lang = navigator.language?.toLowerCase() || '';
    if (lang.startsWith('pt-br') || lang === 'pt') {
      return 'BRL';
    }
    if (lang.startsWith('es-') && !lang.startsWith('es-es')) {
      return 'LATAM';
    }

    return 'USD';
  } catch {
    return 'USD';
  }
}

export function formatPrice(amount: number, symbol: string, currency: string): string {
  if (currency === 'BRL') {
    return `${symbol}\u00A0${amount.toFixed(2).replace('.', ',')}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
}
