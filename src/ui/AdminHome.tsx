import { useRef, useState } from 'preact/hooks';
import { copyText, useFocusHeading } from './common';

/** 응답 화면 주소. 배포에서는 '/', 파일로 열었을 때는 같은 폴더의 index.html */
function publicUrl(): string {
  const dir = new URL('./', window.location.href).href;
  return window.location.protocol === 'file:' ? `${dir}index.html` : dir;
}

export function AdminHome() {
  const heading = useFocusHeading('admin');
  const [status, setStatus] = useState('');
  const linkRef = useRef<HTMLInputElement>(null);
  const base = publicUrl();
  const pilotLink = `${base}#/pilot`;

  const copy = async () => {
    setStatus((await copyText(pilotLink, linkRef.current)) ? '파일럿 참여 링크를 복사했습니다.' : '복사하지 못했습니다. 칸의 내용을 직접 복사해 주세요.');
  };

  return (
    <main class="page admin">
      <h1 ref={heading} tabIndex={-1}>
        관리 화면
      </h1>
      <p class="notice" role="note">
        진행자용 화면입니다. 응답 화면에는 이리로 오는 링크가 없지만, 주소를 아는 사람은 열 수 있습니다. 팀 화면은 응답 화면에서도 열 수 있습니다. 이 화면에는 저장된 응답이 없고, 붙여
        넣거나 불러온 내용은 이 브라우저에서만 처리합니다.
      </p>

      <section class="card entry-card">
        <h2>우리 팀 구성</h2>
        <p>팀원들이 보낸 팀 코드를 모아 팀에 다섯 방식이 어떻게 섞여 있는지 보고, 팀이 맡은 사업의 단계에 필요한 조합과 비교합니다.</p>
        <a class="btn btn-secondary" href="#/team">
          팀 화면 열기
        </a>
      </section>

      <section class="card entry-card">
        <h2>파일럿</h2>
        <p>
          참여자에게는 아래 참여 링크를 보내 주세요. 이 링크로 들어온 브라우저에서만 결과 화면에 '파일럿 응답 파일 내보내기'가 나타납니다.
        </p>
        <label for="pilot-link">파일럿 참여 링크</label>
        <div class="copy-row">
          <input id="pilot-link" ref={linkRef} readOnly value={pilotLink} onFocus={(e) => (e.target as HTMLInputElement).select()} />
          <button type="button" class="btn btn-secondary" onClick={copy}>
            복사
          </button>
        </div>
        <p class="hint" role="status">
          {status}
        </p>
        <a class="btn btn-secondary" href="#/analysis">
          응답 분석 열기
        </a>
      </section>

      <p class="minor-link">
        <a href={base} class="text-link">
          응답 화면 열기
        </a>
      </p>
    </main>
  );
}
