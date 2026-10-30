import { useEffect, useRef, useState } from 'preact/hooks';

/** 차트를 실제 픽셀 폭으로 그려 글자 크기가 화면 폭에 따라 늘거나 줄지 않게 한다 */
export function useWidth<T extends HTMLElement>(fallback = 343) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      if (w > 0) setWidth(w);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
