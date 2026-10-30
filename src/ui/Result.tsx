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
  PARTNER_LEAD_FLAT,
  PARTNER_NONE,
  pickedText,
  PROFILE_LABELS,
  PROFILES,
  typeName,
  type Profile,
} from '../data/profiles';
import { clearProgress, loadProgress, summaryOf } from '../progress';
import { navigate } from '../router';
import { bCounts, neededPicks, score } from '../scoring';
import type { Archetype, Summary } from '../types';
import { TypeMap } from './charts/TypeMap';
import { Crest } from './Crest';
import { copyText, prefersReducedMotion, Section, useFocusHeading } from './common';

/** 이 브라우저에 저장된 내 응답의 결과와 같으면 '내 결과'. 별명은 비교하지 않는다. */
function isOwn(summary: Summary): boolean {
  const p = loadProgress();
  if (!p?.finishedAt) return false;
  const s = summaryOf(p);
  return s !== null && encode(s) === encode(summary);
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
  return <ResultView summary={decoded.summary} nick={decoded.nick} own={isOwn(decoded.summary)} headingRef={heading} />;
}

function ResultView({
  summary,
  nick,
  own,
  headingRef,
}: {
  summary: Summary;
  nick: string | null;
  own: boolean;
  headingRef: ReturnType<typeof useFocusHeading>;
}) {
  const r = useMemo(() => score(summary), [summary]);
  const { core, second, growth, partners } = r.placement;
  // 코드를 읽을 때 정해지지 않은 결과는 걸러지므로 여기서는 늘 정해져 있다
  const c = core!;
  const s = second!;
  const pair = combo(c, s);
  // 실제로 동점이라 본인이 고른 자리만 알린다(받은 코드에 남은 선택은 여기서 거른다)
  const picked = pickedText(neededPicks(summary.aSum, bCounts(summary.b).best, summary.picks));

  const toShare = () => {
    const h = document.getElementById('sec-share');
    if (!h) return;
    h.setAttribute('tabindex', '-1');
    h.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    h.focus({ preventScroll: true });
  };

  return (
    <main class="page result">
      {!own && (
        <p class="notice" role="note">
          이 브라우저에 저장된 내 응답의 결과가 아니어서 보기만 할 수 있습니다.
        </p>
      )}

      <header class="result-head">
        <div class="result-crests">
          <Crest archetype={c} size={112} animate />
          <Crest archetype={s} size={52} animate />
        </div>
        <p class="eyebrow">{own ? '나의 업무 유형' : nick ? `${nick} 님의 업무 유형` : '업무 유형'}</p>
        <h1 ref={headingRef} tabIndex={-1} class="type-name">
          {typeName(c, s)}
        </h1>
        <p class="one-line">{PROFILES[c].oneLine}</p>
        <p class="lead">
          {leadText(c, s)}
          {r.closePair && !r.flat && ` ${CLOSE_PAIR_TEXT}`}
          {r.flat && ` ${FLAT_TEXT}`}
          {picked && ` ${picked}`}
        </p>
        {own && (
          <p class="no-print">
            <button type="button" class="btn btn-secondary btn-small" onClick={toShare}>
              팀 코드 보기
            </button>
          </p>
        )}
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
            <dt>이 조합에서 주의할 점</dt>
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

      <Section title="채워 줄 짝" id="sec-partners">
        {partners.length ? (
          <>
            <p class="hint">{r.flat ? PARTNER_LEAD_FLAT : PARTNER_LEAD}</p>
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
        <Share summary={summary} initialNick={nick ?? ''} />
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

/** 한 줄 설명(머리에 이미 나옴)과 늘 함께 있어야 할 사람(채워 줄 짝에 나옴)은 뺀다 */
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

function Share({ summary, initialNick }: { summary: Summary; initialNick: string }) {
  const [nick, setNick] = useState(initialNick);
  const [confirmClear, setConfirmClear] = useState(false);
  // 복사 결과는 화면에도 보여 준다(role=status라 스크린리더도 읽는다)
  const [status, setStatus] = useState('');
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
  const teamCode = encode(summary, nick);
  // 팀 코드와 결과 링크는 같은 코드를 담는다(별명 포함). 진행자는 어느 쪽을 받아도 팀 화면에 붙여 넣을 수 있다.
  const link = `${window.location.origin}${window.location.pathname}#/result/${teamCode}`;

  const copy = async (text: string, el: HTMLInputElement | null, what: string) => {
    const ok = await copyText(text, el);
    setStatus(ok ? `${what}를 복사했습니다.` : `${what}를 복사하지 못했습니다. 칸의 내용을 직접 복사해 주세요.`);
  };

  const clear = () => {
    clearProgress();
    navigate('#/', true);
  };

  return (
    <Section title="공유" id="sec-share">
      <p class="notice" role="note">
        팀 코드나 결과 링크를 다른 사람에게 보내면 내 결과 요약(다섯 방식 점수, 상황별로 고른 역할)과 아래에 적은 별명이 함께 전달됩니다. 문항별 응답은 들어가지 않습니다.
      </p>

      <div class="field no-print">
        <label for="share-nick">별명(선택, {NICK_MAX}자까지)</label>
        <input id="share-nick" maxLength={NICK_MAX} value={nick} onInput={(e) => {
            setNick((e.target as HTMLInputElement).value);
            setStatus('');
          }} />
      </div>

      <div class="field no-print">
        <label for="share-code">팀 코드</label>
        <div class="copy-row">
          <input id="share-code" ref={codeRef} readOnly value={teamCode} onFocus={(e) => (e.target as HTMLInputElement).select()} />
          <button type="button" class="btn btn-secondary" onClick={() => copy(teamCode, codeRef.current, '팀 코드')}>
            복사
          </button>
        </div>
        <p class="hint">진행자에게는 이 팀 코드를 보내 주세요. 처음 화면의 '받은 결과 보기'에 넣으면 이 결과를 다시 열 수 있습니다.</p>
      </div>

      {isWeb && (
        <div class="field no-print">
          <label for="share-link">결과 링크</label>
          <div class="copy-row">
            <input id="share-link" ref={linkRef} readOnly value={link} onFocus={(e) => (e.target as HTMLInputElement).select()} />
            <button type="button" class="btn btn-secondary" onClick={() => copy(link, linkRef.current, '결과 링크')}>
              복사
            </button>
          </div>
          <p class="hint">링크를 열면 이 결과가 바로 보입니다. 위에 적은 별명도 함께 들어갑니다.</p>
        </div>
      )}

      <p class="hint no-print" role="status">
        {status}
      </p>

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
          <button type="button" class="btn btn-danger-quiet" onClick={() => setConfirmClear(true)}>
            내 응답 지우기
          </button>
        ) : (
          <div class="confirm" role="group" aria-label="응답 지우기 확인">
            <p>이 브라우저에 저장된 응답과 결과를 지웁니다. 되돌릴 수 없습니다.</p>
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
