'use client';

import { useEffect, useState } from 'react';

/**
 * Sabe si el viewport está en (o por encima de) un breakpoint dado.
 * Por defecto usa 1024px — el breakpoint `lg` de Tailwind (sin overrides
 * en tailwind.config.ts), el mismo que separa el aside sticky de escritorio
 * del acordeón inline de móvil en el dashboard.
 *
 * SSR-safe: antes de montar asume desktop (evita parpadeos de layout ya
 * que el propio CSS —no este hook— decide qué se ve en cada breakpoint;
 * el hook solo condiciona lógica de interacción, como el toggle-close del
 * acordeón en móvil).
 */
export function useIsDesktop(breakpoint = 1024): boolean {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [breakpoint]);

  return isDesktop;
}
