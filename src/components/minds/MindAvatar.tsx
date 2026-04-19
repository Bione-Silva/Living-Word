import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MindAvatarProps {
  src: string;
  name: string;
  size?: number;
  className?: string;
  imgClassName?: string;
  grayscale?: boolean;
}

/**
 * Avatar resiliente para Mentes Brilhantes.
 * Usa <img> com import ESM (vite resolve hash). Em caso de erro de carga
 * (cache/CDN/imagem ausente), renderiza fallback com iniciais elegantes.
 */
export function MindAvatar({
  src,
  name,
  size = 96,
  className,
  imgClassName,
  grayscale = false,
}: MindAvatarProps) {
  const [errored, setErrored] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

  if (errored || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center w-full h-full rounded-full bg-[hsl(252,100%,98%)] text-[hsl(257,61%,32%)] font-display font-bold tracking-tight',
          className,
        )}
        style={{ fontSize: Math.max(14, Math.round(size * 0.36)) }}
        aria-label={name}
      >
        {initials || '✦'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={cn(
        'w-full h-full object-cover',
        grayscale && 'grayscale brightness-75',
        imgClassName,
      )}
    />
  );
}
