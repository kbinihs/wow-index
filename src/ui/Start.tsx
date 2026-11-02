import { useState } from 'preact/hooks';
import { decode, DECODE_ERROR_TEXT, encode } from '../codec';
import { DISCLAIMER } from '../data/profiles';
import { clearProgress, hasAnswers, loadProgress, newProgress, saveProgress, summaryOf } from '../progress';
import { extractCode, navigate, resultHash } from '../router';
import { ARCHETYPES } from '../types';
import { NAMES } from '../data/profiles';
import { isPilotMode } from '../pilotMode';
import { Horizon, TITLE_SUB, Wordmark } from './Brand';
import { useFocusHeading } from './common';
import { Crest } from './Crest';

export function Start() {
  const heading = useFocusHeading('start');
  const [saved, setSaved] = useState(loadProgress);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  const finished = saved?.finishedAt ? summaryOf(saved) : null;
  const inProgress = saved && !saved.finishedAt && hasAnswers(saved);

  const begin = () => {
    clearProgress();
    saveProgress(newProgress());
    setSaved(null);
    navigate('#/test');
  };

  const openCode = (e: Event) => {
    e.preventDefault();
    const code = extractCode(codeInput);
    const r = decode(code);
    if (!r.ok) {
      setCodeError(DECODE_ERROR_TEXT[r.error]);
      return;
    }
    setCodeError(null);
    navigate(resultHash(code));
  };

  return (
    <main class="page start">
      <section class="hero">
        <Horizon />
        <p class="hero-eyebrow">{TITLE_SUB}</p>
        <h1 ref={heading} tabIndex={-1} class="hero-title">
          <Wordmark />
        </h1>
        <p class="hero-sub">나는 어떻게 일하고 있나</p>
        <ul class="hero-crests" aria-label="다섯 가지 업무 방식">
          {ARCHETYPES.map((a, i) => (
            <li key={a} style={{ '--i': i } as Record<string, number>}>
              <Crest archetype={a} size={48} animate />
              <span>{NAMES[a]}</span>
            </li>
          ))}
        </ul>
      </section>
      <p class="lead">
        질문에 답하면 다섯 가지 업무 방식 가운데 내가 주로 선택하는 두 가지를 주 유형과 보조 유형으로 보여 줍니다.
      </p>
      <ul class="facts">
        <li>문항 20개와 상황 6개, 5분 정도 걸립니다.</li>
        <li>응답은 이 브라우저 안에서만 처리하고 서버로 보내지 않습니다.</li>
        <li>중간에 창을 닫아도 이 브라우저에 저장되어 이어서 할 수 있습니다.</li>
      </ul>
      {isPilotMode() && (
        <p class="notice" role="note">
          파일럿 참여 링크로 들어왔습니다. 응답을 마치면 결과 화면에서 응답 파일을 내보낼 수 있습니다.
        </p>
      )}

      <div class="actions">
        {finished ? (
          <>
            <a class="btn btn-primary" href={resultHash(encode(finished))}>
              내 결과 보기
            </a>
            <button type="button" class="btn btn-secondary" onClick={() => setConfirmRestart(true)}>
              다시 하기
            </button>
          </>
        ) : inProgress ? (
          <>
            <a class="btn btn-primary" href="#/test">
              이어서 하기
            </a>
            <button type="button" class="btn btn-secondary" onClick={() => setConfirmRestart(true)}>
              처음부터 다시 하기
            </button>
          </>
        ) : (
          <button type="button" class="btn btn-primary" onClick={begin}>
            시작하기
          </button>
        )}
      </div>
      {confirmRestart && (
        <div class="confirm" role="group" aria-label="다시 하기 확인">
          <p>
            {finished
              ? '이 브라우저에 저장된 응답과 결과를 지우고 처음부터 시작합니다. 지금 결과를 남기려면 먼저 결과 화면에서 팀 코드를 복사해 두세요.'
              : '이 브라우저에 저장된 응답을 지우고 처음부터 시작합니다.'}
          </p>
          <button type="button" class="btn btn-danger" onClick={begin}>
            지우고 시작하기
          </button>
          <button type="button" class="btn btn-secondary" onClick={() => setConfirmRestart(false)}>
            취소
          </button>
        </div>
      )}

      <form class="card code-form" onSubmit={openCode}>
        <h2>받은 결과 보기</h2>
        <label for="code-input">팀 코드나 결과 링크</label>
        <input
          id="code-input"
          value={codeInput}
          autoComplete="off"
          spellcheck={false}
          aria-invalid={codeError ? 'true' : undefined}
          aria-describedby={codeError ? 'code-error' : undefined}
          onInput={(e) => setCodeInput((e.target as HTMLInputElement).value)}
        />
        {codeError && (
          <p id="code-error" class="error" role="alert">
            {codeError}
          </p>
        )}
        <button type="submit" class="btn btn-secondary">
          결과 열기
        </button>
      </form>

      <footer class="disclaimer">{DISCLAIMER}</footer>
    </main>
  );
}
