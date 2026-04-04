import { useEffect, useState } from 'react';

/** iPhone 12 Pro ≈ 390px; align with header burger breakpoint */
const DEFAULT_MAX = 768;

/**
 * True when viewport width is at or below breakpoint (mobile / narrow web app).
 */
export function useCompactLayout(maxWidthPx: number = DEFAULT_MAX): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [maxWidthPx]);

  return compact;
}
