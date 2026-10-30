import { useMemo, useRef, useState } from 'preact/hooks';
import { buildPilotRecord, LABEL_MAX, pilotFileName } from '../pilot';
import { encode } from '../codec';
import { loadProgress, summaryOf } from '../progress';
import { resultHash } from '../router';
import { announce, copyText, downloadText, useFocusHeading } from './common';

/** 파일럿 참여자가 문항별 응답을 파일로 내보낸다(설계서 8.2의 4). 결과 링크·팀 코드와 따로 쓴다. */
export function Export() {
  const heading = useFocusHeading('export');
  const progress = useMemo(loadProgress, []);
  const [label, setLabel] = useState('');
  const [agree, setAgree] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const record = progress ? buildPilotRecord(progress, label) : null;

  if (!record) {
    return (
      <main class="page">
        <h1 ref={heading} tabIndex={-1}>
          응답 파일 내보내기
        </h1>
        <p>내보낼 응답이 없습니다. 테스트를 끝낸 뒤 결과 화면에서 다시 열어 주세요.</p>
        <a class="btn btn-secondary" href="#/">
          처음 화면으로
        </a>
      </main>
    );
  }

  const json = JSON.stringify(record, null, 2);
  const save = () => {
    const ok = downloadText(pilotFileName(record), json, 'application/json');
    announce(ok ? '파일을 내려받았습니다.' : '파일을 내려받지 못했습니다. 아래 파일 내용을 복사해 진행자에게 보내 주세요.');
  };

  return (
    <main class="page">
      <h1 ref={heading} tabIndex={-1}>
        응답 파일 내보내기
      </h1>
      <p class="lead">파일럿 참여자만 쓰는 화면입니다. 문항을 다듬는 데 쓰도록 내 응답 원본을 파일로 만듭니다. 만든 파일은 진행자에게 직접 보내 주세요.</p>
      <ul class="facts">
        <li>담기는 것: 문항별 답, 문항과 선택지가 나온 순서, 단계별로 걸린 시간, 결과 유형</li>
        <li>담기지 않는 것: 이름, 연락처, 팀 코드에 적은 별명</li>
        <li>파일은 이 기기에만 저장되고, 저절로 보내지지 않습니다.</li>
      </ul>

      <div class="card">
        <div class="field">
          <label for="pilot-label">참여 번호(선택)</label>
          <input id="pilot-label" maxLength={LABEL_MAX} value={label} onInput={(e) => setLabel((e.target as HTMLInputElement).value)} />
          <p class="hint">진행자가 번호를 알려 줬다면 적어 주세요.</p>
        </div>
        <label class="toggle">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree((e.target as HTMLInputElement).checked)} />
          <span>위 내용을 확인했고, 내 응답 파일을 파일럿 분석에 쓰는 데 동의합니다.</span>
        </label>
        <div class="actions">
          <button type="button" class="btn btn-primary" disabled={!agree} onClick={save}>
            파일 내려받기
          </button>
        </div>
        {agree && (
          <details class="table-view">
            <summary>파일 내용 보기(내려받기가 안 될 때)</summary>
            <textarea ref={textRef} readOnly rows={8} value={json} aria-label="응답 파일 내용" />
            <button
              type="button"
              class="btn btn-secondary btn-small"
              onClick={async () => announce((await copyText(json, textRef.current)) ? '파일 내용을 복사했습니다.' : '복사하지 못했습니다. 칸의 내용을 직접 복사해 주세요.')}
            >
              내용 복사
            </button>
          </details>
        )}
      </div>

      <p>
        <a href={resultHash(encode(summaryOf(progress!)!))} class="text-link">
          내 결과로 돌아가기
        </a>
      </p>
    </main>
  );
}
