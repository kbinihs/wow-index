import { useEffect, useState } from 'preact/hooks';

export { extractCode } from './codec';

/** 응답 화면(index.html): 누구나 쓰는 화면 */
export type Route =
  | { name: 'start' }
  | { name: 'test' }
  | { name: 'result'; code: string }
  | { name: 'export' }
  | { name: 'pilot' };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/test') return { name: 'test' };
  if (path === '/export') return { name: 'export' };
  if (path === '/pilot') return { name: 'pilot' };
  const m = path.match(/^\/result\/(.+)$/);
  if (m) return { name: 'result', code: m[1] };
  return { name: 'start' };
}

/** 관리 화면(admin.html): 진행자만 쓰는 화면 */
export type AdminRoute = { name: 'home' } | { name: 'team' } | { name: 'analysis' };

export function parseAdminHash(hash: string): AdminRoute {
  const path = hash.replace(/^#/, '') || '/';
  if (path === '/team') return { name: 'team' };
  if (path === '/analysis') return { name: 'analysis' };
  return { name: 'home' };
}

export const resultHash = (code: string) => `#/result/${code}`;

export function navigate(hash: string, replace = false): void {
  if (replace) window.location.replace(hash);
  else window.location.hash = hash;
}

function useHash<T>(parse: (hash: string) => T): T {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const useRoute = (): Route => useHash(parseHash);
export const useAdminRoute = (): AdminRoute => useHash(parseAdminHash);
