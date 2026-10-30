import { useEffect, useState } from 'preact/hooks';

export type Route =
  | { name: 'start' }
  | { name: 'test' }
  | { name: 'result'; code: string }
  | { name: 'team' }
  | { name: 'export' }
  | { name: 'analysis' };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/test') return { name: 'test' };
  if (path === '/team') return { name: 'team' };
  if (path === '/export') return { name: 'export' };
  if (path === '/analysis') return { name: 'analysis' };
  const m = path.match(/^\/result\/(.+)$/);
  if (m) return { name: 'result', code: m[1] };
  return { name: 'start' };
}

export const resultHash = (code: string) => `#/result/${code}`;

/** 링크나 코드를 붙여 넣었을 때 코드 부분만 */
export function extractCode(input: string): string {
  const m = input.match(/#\/result\/([^\s?#]+)/);
  return (m ? m[1] : input).trim();
}

export function navigate(hash: string, replace = false): void {
  if (replace) window.location.replace(hash);
  else window.location.hash = hash;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
