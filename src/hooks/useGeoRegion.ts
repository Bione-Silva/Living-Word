import { useState, useEffect } from 'react';
import { detectUserRegion, PRICING_MAP, type GeoRegion } from '@/utils/geoPricing';

export function useGeoRegion() {
  const [region, setRegion] = useState<GeoRegion | null>(null);

  useEffect(() => {
    detectUserRegion().then(setRegion);
  }, []);

  const pricing = region ? PRICING_MAP[region] : null;

  return { region, pricing, loading: region === null };
}
