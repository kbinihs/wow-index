import { useEffect } from 'preact/hooks';
import { useRoute, type Route } from '../router';
import { Result } from './Result';
import { Start } from './Start';
import { Test } from './Test';
import { Wordmark } from './Brand';
import { Team } from './Team';
import { Export } from './Export';
import { Analysis } from './Analysis';

/** 탭·방문 기록·스크린리더가 지금 화면을 알 수 있게 페이지 제목을 바꾼다 */
const TITLES: Record<Route['name'], string> = {
  start: '',
  test: '질문에 답하기',
  result: '결과',
  team: '우리 팀 구성',
  export: '응답 파일 내보내기',
  analysis: '파일럿 응답 분석',
};

export function App() {
  const route = useRoute();
  useEffect(() => {
    const t = TITLES[route.name];
    document.title = t ? `${t} · WoW Index` : 'WoW Index';
  }, [route.name]);
  return (
    <>
      <a class="skip-link" href="#main-content" onClick={(e) => {
        e.preventDefault();
        document.querySelector<HTMLElement>('main h1')?.focus();
      }}>
        본문으로 건너뛰기
      </a>
      {/* 첫 화면은 큰 제목이 있어 머리줄을 두지 않는다 */}
      {route.name !== 'start' && (
        <header class="site-header no-print">
          <a href="#/" class="site-title">
            <Wordmark />
          </a>
        </header>
      )}
      {route.name === 'test' && <Test />}
      {route.name === 'result' && <Result key={route.code} code={route.code} />}
      {route.name === 'team' && <Team />}
      {route.name === 'export' && <Export />}
      {route.name === 'analysis' && <Analysis />}
      {route.name === 'start' && <Start />}
      <div id="live-region" class="sr-only" aria-live="polite" aria-atomic="true" />
    </>
  );
}
