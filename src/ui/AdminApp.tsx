import { useEffect } from 'preact/hooks';
import { useAdminRoute, type AdminRoute } from '../router';
import { AdminHome } from './AdminHome';
import { Analysis } from './Analysis';
import { Wordmark } from './Brand';
import { Team } from './Team';

const TITLES: Record<AdminRoute['name'], string> = {
  home: '관리',
  team: '우리 팀 구성',
  analysis: '파일럿 응답 분석',
};

/** 관리 화면(admin.html). 응답 화면에서는 이리로 오는 링크를 두지 않는다. */
export function AdminApp() {
  const route = useAdminRoute();
  useEffect(() => {
    document.title = `${TITLES[route.name]} · WoW Index`;
  }, [route.name]);
  return (
    <>
      <a
        class="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.querySelector<HTMLElement>('main h1')?.focus();
        }}
      >
        본문으로 건너뛰기
      </a>
      <header class="site-header no-print">
        <a href="#/" class="site-title">
          <Wordmark />
          <span class="site-badge">관리</span>
        </a>
      </header>
      {route.name === 'home' && <AdminHome />}
      {route.name === 'team' && <Team home="관리 화면으로" />}
      {route.name === 'analysis' && <Analysis />}
      <div id="live-region" class="sr-only" aria-live="polite" aria-atomic="true" />
    </>
  );
}
