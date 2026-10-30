import { useMemo, useRef, useState } from 'preact/hooks';
import { decode, DECODE_ERROR_TEXT, encode, NICK_MAX } from '../codec';
import {
  CLOSE_PAIR_TEXT,
  combo,
  DISCLAIMER,
  FLAT_TEXT,
  GROWTH,
  GROWTH_LEAD,
  leadText,
  NAMES,
  PARTNER,
  PARTNER_LEAD,
  PARTNER_NONE,
  PROFILE_LABELS,
  PROFILES,
  typeName,
  type Profile,
} from '../data/profiles';
import { clearProgress, loadProgress, summaryOf } from '../progress';
import { navigate } from '../router';
import { score } from '../scoring';
import type { Archetype, Summary } from '../types';
import { TypeMap } from './charts/TypeMap';
import { Crest } from './Crest';
import { announce, copyText, Section, useFocusHeading } from './common';

/** 저장된 내 응답에서 나온 코드와 같으면 '내 결과' */
function isOwn(code: string): boolean {
  const p = loadProgress();
  if (!p?.finishedAt) return false;
  const s = summaryOf(p);
  return s !== null && encode(s) === code;
}

export function Result({ code }: { code: string }) {
  const heading = useFocusHeading(code);
  const decoded = useMemo(() => decode(code), [code]);

  if (!decoded.ok) {
    return (
      <main class="page">
        <h1 ref={heading} tabIndex={-1}>
          결과를 열 수 없습니다
        </h1>
        <p class="banner" role="alert">
          {DECODE_ERROR_TEXT[decoded.error]}
        </p>
        <p>
          <a class="btn btn-secondary" href="#/">
            처음 화면으로
          </a>
        </p>
      </main>
    );
  }
  return <ResultView summary={decoded.summary} code={code} own={isOwn(code)} headingRef={heading} />;
}

function ResultView({
  summary,
  code,
  own,
  headingRef,
}: {
  summary: Summary;
  code: string;
  own: boolean;
  headingRef: ReturnType<typeof useFocusHeading>;
}) {
  const r = useMemo(() => score(summary), [summary]);
  const { core, second, growth, partners } = r.placement;
  // 코드를 읽을 때 정해지지 않은 결과는 걸러지므로 여기서는 늘 정해져 있다
  const c = core!;
  const s = second!;
  const pair = combo(c, s);

  return (
    <main class="page result">
      {!own && (
        <p class="notice" role="note">
          다른 사람이 보낸 결과입니다.
        </p>
      )}

      <header class="result-head">
        <div class="result-crests">
          <Crest archetype={c} size={112} animate title={`주 유형 ${NAMES[c]} 문양`} />
          <Crest archetype={s} size={52} animate title={`보조 유형 ${NAMES[s]} 문양`} />
        </div>
        <p class="eyebrow">나의 업무 유형</p>
        <h1 ref={headingRef} tabIndex={-1} class="type-name">
          {typeName(c, s)}
        </h1>
        <p class="one-line">{PROFILES[c].oneLine}</p>
        <p class="lead">
          {leadText(c, s)}
          {r.closePair && ` ${CLOSE_PAIR_TEXT}`}
          {r.flat && ` ${FLAT_TEXT}`}
        </p>
      </header>

      <Section title="한눈에 보기" id="sec-map">
        <TypeMap placement={r.placement} />
      </Section>

      <Section title="이렇게 일합니다" id="sec-combo">
        <p class="combo-name">
          {NAMES[c]} <span class="combo-plus">+</span> {NAMES[s]}
        </p>
        <p>{pair.how}</p>
        <dl class="rows">
          <div class="row">
            <dt>주의할 점</dt>
            <dd>{pair.caution}</dd>
          </div>
          <div class="row">
            <dt>보조 유형 {NAMES[s]}</dt>
            <dd>{PROFILES[s].oneLine}</dd>
          </div>
        </dl>
      </Section>

      <Section title={`주 유형: ${NAMES[c]}`} id="sec-core">
        <p class="core-badge">
          <Crest archetype={c} size={40} />
          <span>{PROFILES[c].oneLine}</span>
        </p>
        <ProfileRows archetype={c} />
      </Section>

      <Section title="성장 방향" id="sec-growth">
        <p class="hint">{GROWTH_LEAD}</p>
        {growth.map((a) => (
          <p key={a} class="direction">
            <strong>→ {NAMES[a]}</strong>
            <span>{GROWTH[a]}</span>
          </p>
        ))}
      </Section>

      <Section title="필요한 짝" id="sec-partners">
        {partners.length ? (
          <>
            <p class="hint">{PARTNER_LEAD}</p>
            <ul class="partner-list">
              {partners.map((a) => (
                <li key={a}>
                  <strong>{NAMES[a]}</strong>
                  <span>{PARTNER[c][a]}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>{PARTNER_NONE}</p>
        )}
        {PROFILES[c].alwaysWith && (
          <p class="always">
            {PROFILE_LABELS.alwaysWith}: {PROFILES[c].alwaysWith}
          </p>
        )}
      </Section>

      {own ? (
        <Share summary={summary} code={code} />
      ) : (
        <div class="actions no-print">
          <button type="button" class="btn btn-secondary" onClick={() => window.print()}>
            인쇄
          </button>
          <a class="btn btn-secondary" href="#/">
            처음 화면으로
          </a>
        </div>
      )}

      <footer class="disclaimer">{DISCLAIMER}</footer>
    </main>
  );
}

/** 한 줄 설명(머리에 이미 나옴)과 늘 함께 있어야 할 사람(필요한 짝에 나옴)은 뺀다 */
const SHOWN: (keyof Profile)[] = ['values', 'strengths', 'fits', 'cautions', 'ngoNote', 'selfCheck', 'indicators'];

function ProfileRows({ archetype }: { archetype: Archetype }) {
  const p = PROFILES[archetype];
  return (
    <dl class="rows">
      {SHOWN.filter((k) => p[k]).map((k) => (
        <div key={k} class="row">
          <dt>{PROFILE_LABELS[k]}</dt>
          <dd>
            {Array.isArray(p[k]) ? (
              <ul class="bullets">
                {(p[k] as string[]).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : (
              p[k]
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Share({ summary, code }: { summary: Summary; code: string }) {
  const [nick, setNick] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  // 다른 페이지 안에 끼워진 채(미리보기 등) 열렸으면 주소가 공유용이 아니라서 코드만 보여 준다
  const framed = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const isWeb = /^https?:$/.test(window.location.protocol) && !framed;
  const link = `${window.location.origin}${window.location.pathname}#/result/${code}`;
  const teamCode = encode(summary, nick);

  const copy = async (text: string, el: HTMLInputElement | null, what: string) => {
    const ok = await copyText(text, el);
    announce(ok ? `${what}를 복사했습니다.` : `${what}를 복사하지 못했습니다. 칸의 내용을 직접 복사해 주세요.`);
  };

  const clear = () => {
    clearProgress();
    navigate('#/', true);
  };

  return (
    <Section title="공유" id="sec-share">
      <p class="notice" role="note">
        링크나 코드를 다른 사람에게 보내면 내 결과 요약(다섯 방식 점수, 상황별로 고른 역할)이 함께 전달됩니다. 문항별 답은 들어가지 않습니다.
      </p>

      {isWeb && (
        <div class="field no-print">
          <label for="share-link">결과 링크</label>
          <div class="copy-row">
            <input id="share-link" ref={linkRef} readOnly value={link} onFocus={(e) => (e.target as HTMLInputElement).select()} />
            <button type="button" class="btn btn-secondary" onClick={() => copy(link, linkRef.current, '결과 링크')}>
              복사
            </button>
          </div>
        </div>
      )}

      <div class="field no-print">
        <label for="share-nick">별명(선택, {NICK_MAX}자까지)</label>
        <input id="share-nick" maxLength={NICK_MAX} value={nick} onInput={(e) => setNick((e.target as HTMLInputElement).value)} />
        <label for="share-code">팀 코드</label>
        <div class="copy-row">
          <input id="share-code" ref={codeRef} readOnly value={teamCode} onFocus={(e) => (e.target as HTMLInputElement).select()} />
          <button type="button" class="btn btn-secondary" onClick={() => copy(teamCode, codeRef.current, '팀 코드')}>
            복사
          </button>
        </div>
        <p class="hint">팀 코드를 진행자에게 보내면 팀 화면에서 함께 볼 수 있습니다. 처음 화면의 '받은 결과 보기'에 넣으면 이 결과를 다시 열 수 있습니다.</p>
      </div>

      <p class="minor-link no-print">
        <a href="#/export" class="text-link">
          파일럿에 참여했다면 응답 파일 내보내기
        </a>
      </p>

      <div class="actions no-print">
        <button type="button" class="btn btn-secondary" onClick={() => window.print()}>
          인쇄
        </button>
        {!confirmClear ? (
          <button type="button" class="btn btn-danger" onClick={() => setConfirmClear(true)}>
            내 응답 지우기
          </button>
        ) : (
          <div class="confirm" role="group" aria-label="응답 지우기 확인">
            <p>이 브라우저에 저장된 응답을 지웁니다. 되돌릴 수 없습니다.</p>
            <button type="button" class="btn btn-danger" onClick={clear}>
              지우기
            </button>
            <button type="button" class="btn btn-secondary" onClick={() => setConfirmClear(false)}>
              취소
            </button>
          </div>
        )}
      </div>
    </Section>
  );
}
