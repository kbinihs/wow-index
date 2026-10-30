import { useRoute } from '../router';
import { Result } from './Result';
import { Start } from './Start';
import { Test } from './Test';
import { Wordmark } from './Brand';
import { Team } from './Team';
import { Export } from './Export';
import { Analysis } from './Analysis';

export function App() {
  const route = useRoute();
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
