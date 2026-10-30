import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

/** 문장 안에서 강조할 부분만 <strong>으로 감싼다 */
export function Emph({ text, bold }: { text: string; bold: readonly string[] }) {
  const parts: ComponentChildren[] = [];
  let rest = text;
  while (rest) {
    const hits = bold.map((b) => [b, rest.indexOf(b)] as const).filter(([, i]) => i >= 0);
    if (!hits.length) {
      parts.push(rest);
      break;
    }
    const [b, i] = hits.reduce((x, y) => (y[1] < x[1] ? y : x));
    if (i > 0) parts.push(rest.slice(0, i));
    parts.push(<strong>{b}</strong>);
    rest = rest.slice(i + b.length);
  }
  return <>{parts}</>;
}

/** 스크린리더에 상태 변화를 읽어 준다(App에 하나 있는 live region) */
export function announce(message: string): void {
  const el = document.getElementById('live-region');
  if (!el) return;
  el.textContent = '';
  window.setTimeout(() => (el.textContent = message), 50);
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** 화면이 바뀌면 맨 위로 올리고 제목에 초점을 둔다 */
export function useFocusHeading(dep: unknown) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    ref.current?.focus({ preventScroll: true });
  }, [dep]);
  return ref;
}

export async function copyText(text: string, fallbackInput?: HTMLInputElement | HTMLTextAreaElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (!fallbackInput) return false;
    fallbackInput.focus();
    fallbackInput.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    }
  }
}

export function Section({ title, children, id }: { title: string; children: ComponentChildren; id?: string }) {
  return (
    <section class="card" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

/** 파일 내려받기. 막힌 환경(일부 미리보기 등)에서는 false */
export function downloadText(fileName: string, text: string, type: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
