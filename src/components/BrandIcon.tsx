import iconUrl from '@/assets/livingword-icon.jpg';

interface BrandIconProps {
  className?: string;
  alt?: string;
}

/**
 * Living Word official brand icon (Bible + cross + waveform).
 * Use this anywhere we display the brand mark next to the "Living Word" name.
 */
export function BrandIcon({ className = 'h-full w-full', alt = 'Living Word' }: BrandIconProps) {
  return <img src={iconUrl} alt={alt} className={`${className} object-contain`} />;
}

export default BrandIcon;
