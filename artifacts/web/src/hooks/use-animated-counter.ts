import { useEffect, useRef, useState } from 'react';

interface UseAnimatedCounterOptions {
  /** Total animation duration in ms. Defaults to 2000. */
  duration?: number;
}

/**
 * Animates a numeric value from 0 up to `target` with an easeOutCubic curve,
 * starting the first time the returned ref scrolls into the viewport.
 * Renders the final value immediately when the user prefers reduced motion.
 */
export function useAnimatedCounter<T extends HTMLElement = HTMLDivElement>(
  target: number,
  { duration = 2000 }: UseAnimatedCounterOptions = {},
) {
  const ref = useRef<T | null>(null);
  const [value, setValue] = useState(() =>
    typeof window === 'undefined' ||
    typeof IntersectionObserver === 'undefined' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? target
      : 0,
  );

  const skipAnimationRef = useRef(
    typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || skipAnimationRef.current) return;

    let frameId: number;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        const animate = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * target));
          if (progress < 1) {
            frameId = requestAnimationFrame(animate);
          }
        };
        frameId = requestAnimationFrame(animate);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [target, duration]);

  return { ref, value };
}
