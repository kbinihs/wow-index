import { useEffect, useRef, useState } from 'preact/hooks';
import { encode } from '../codec';
import { PICK_TITLE } from '../data/profiles';
import {
  isStepComplete,
  itemsOnPage,
  loadProgress,
  newProgress,
  placementOf,
  saveProgress,
  STEPS,
  summaryOf,
  type PartKey,
  type Progress,
} from '../progress';
import { navigate, resultHash } from '../router';
import { useFocusHeading } from './common';
import { PartA } from './test/PartA';
import { PartB } from './test/PartB';
import { Pick } from './test/Pick';

const partOf = (step: number): PartKey => (step >= STEPS.length ? 'pick' : STEPS[step].part);

/**
 * 모든 단계가 #/test 한 주소를 쓴다. 그 위에 같은 주소의 기록을 하나 더 쌓아 두고,
 * 브라우저 '뒤로'로 그 기록이 빠지면 이전 단계로 옮긴 뒤 다시 쌓는다.
 */
function atSentinel(): boolean {
  try {
    return (history.state as { wowStep?: boolean } | null)?.wowStep === true;
  } catch {
    return false;
  }
}

function pushSentinel(): void {
  try {
    history.pushState({ wowStep: true }, '');
  } catch {
    // 기록을 쌓을 수 없으면 '뒤로'는 처음 화면으로 간다
  }
}

export function Test() {
  // 끝낸 응답은 덮어쓰지 않는다. 새로 시작하는 것은 처음 화면의 확인을 거쳐서만 한다.
  const [p, setP] = useState<Progress>(() => {
    const saved = loadProgress();
    if (saved) return saved;
    const fresh = newProgress();
    saveProgress(fresh);
    return fresh;
  });
  const placement = placementOf(p);
  const pending = p.step >= STEPS.length ? placement?.pending ?? null : null;
  const heading = useFocusHeading(`${p.step}-${pending?.slot ?? ''}`);
  const enteredAt = useRef(Date.now());
  const stepRef = useRef(p.step);
  const prevRef = useRef<() => void>(() => {});

  useEffect(() => {
    enteredAt.current = Date.now();
  }, [p.step, pending?.slot]);

  useEffect(() => {
    if (p.finishedAt) return;
    if (!atSentinel()) pushSentinel();
    const onPop = () => {
      // 주소의 # 부분이 바뀔 때도(결과로 넘어갈 때, 머리줄 링크 등) popstate가 온다. #/test 안에서 뒤로 간 것만 다룬다.
      if (window.location.hash !== '#/test' || atSentinel()) return;
      if (stepRef.current === 0) {
        history.back();
        return;
      }
      prevRef.current();
      pushSentinel();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const update = (f: (q: Progress) => Progress) =>
    setP((q) => {
      const next = f(q);
      saveProgress(next);
      return next;
    });

  /** 지금 화면에 머문 시간을 파트별로 더한다 */
  const withTime = (q: Progress): Progress => {
    const part = partOf(q.step);
    const spent = Date.now() - enteredAt.current;
    return { ...q, ms: { ...q.ms, [part]: q.ms[part] + spent } };
  };

  const finish = (q: Progress) => {
    const summary = summaryOf(q);
    if (!summary) return;
    saveProgress({ ...withTime(q), finishedAt: new Date().toISOString() });
    // 지금 기록을 결과로 바꿔 끼운다. '뒤로'를 눌러도 응답이 새로 시작되지 않는다.
    navigate(resultHash(encode(summary)), true);
  };

  const go = (to: number) => update((q) => ({ ...withTime(q), step: to }));

  const prev = () => {
    if (p.step >= STEPS.length) {
      if (pending?.slot === 'second' && p.picks.core && placementOf({ ...p, picks: {} })?.pending?.slot === 'core') {
        // 주 유형도 동점이었다면 보조 유형 고르기에서 '이전'은 주 유형 고르기로 돌아간다
        update((q) => ({ ...withTime(q), picks: {} }));
      } else {
        // 답을 고치면 동점 후보가 바뀔 수 있으니 고른 것을 비운다
        update((q) => ({ ...withTime(q), step: STEPS.length - 1, picks: {} }));
      }
      return;
    }
    if (p.step === 0) {
      update(withTime);
      navigate('#/');
    } else go(p.step - 1);
  };
  stepRef.current = p.step;
  prevRef.current = prev;

  const next = () => {
    const step = STEPS[p.step];
    if (!isStepComplete(p, step)) return;
    if (p.step < STEPS.length - 1) return go(p.step + 1);
    // 마지막 B 화면: 동점이 있으면 고르기 화면으로
    const pl = placementOf(p);
    if (pl?.pending) go(STEPS.length);
    else finish(p);
  };

  const confirmPick = (a: NonNullable<typeof p.picks.core>) => {
    if (!pending) return;
    const q = { ...p, picks: { ...p.picks, [pending.slot]: a } };
    if (pending.slot === 'core') q.picks.second = undefined;
    const pl = placementOf(q);
    if (pl?.pending) {
      // 보조 유형도 골라야 한다
      update(() => ({ ...withTime(q) }));
      enteredAt.current = Date.now();
    } else finish(q);
  };

  if (p.finishedAt) {
    // 결과에서 '뒤로'를 눌렀거나 주소로 바로 들어온 경우
    const s = summaryOf(p);
    return (
      <main class="page test">
        <h1 ref={heading} tabIndex={-1}>
          이미 끝낸 응답이 있습니다
        </h1>
        <p>다시 하려면 처음 화면에서 '다시 하기'를 누르세요.</p>
        <div class="actions">
          {s && (
            <a class="btn btn-primary" href={resultHash(encode(s))}>
              내 결과 보기
            </a>
          )}
          <a class="btn btn-secondary" href="#/">
            처음 화면으로
          </a>
        </div>
      </main>
    );
  }

  if (p.step >= STEPS.length) {
    if (!pending) {
      // 답을 바꿔 동점이 풀렸으면 바로 결과로
      return (
        <main class="page test">
          <h1 ref={heading} tabIndex={-1}>
            응답을 모두 마쳤습니다
          </h1>
          <button type="button" class="btn btn-primary" onClick={() => finish(p)}>
            결과 보기
          </button>
        </main>
      );
    }
    return (
      <main class="page test">
        <p class="progress-label">마지막 확인</p>
        <h1 ref={heading} tabIndex={-1}>
          {PICK_TITLE[pending.slot]}
        </h1>
        <Pick
          key={pending.slot}
          slot={pending.slot}
          candidates={pending.candidates}
          initial={p.picks[pending.slot]}
          onConfirm={confirmPick}
          onBack={prev}
        />
      </main>
    );
  }

  const step = STEPS[p.step];
  const complete = isStepComplete(p, step);
  const title = step.part === 'A' ? `업무 선호(${step.page + 1}/5)` : `상황 선택(${step.index + 1}/6)`;

  return (
    <main class="page test">
      <div class="progress-wrap">
        <label for="test-progress" class="progress-label">
          {STEPS.length}단계 중 {p.step + 1}단계
        </label>
        <progress id="test-progress" max={STEPS.length} value={p.step + 1} />
      </div>

      <h1 ref={heading} tabIndex={-1}>
        {title}
      </h1>

      {step.part === 'A' && (
        <PartA
          ids={itemsOnPage(p, step.page)}
          answers={p.a}
          onAnswer={(id, v) => update((q) => ({ ...q, a: { ...q.a, [id]: v }, picks: {} }))}
        />
      )}
      {step.part === 'B' && (
        <PartB
          index={step.index}
          order={p.bOrder[step.index]}
          choice={p.b[step.index]}
          onChange={(c) => update((q) => ({ ...q, b: q.b.map((x, i) => (i === step.index ? c : x)), picks: {} }))}
        />
      )}

      <div class="dock">
        {!complete && (
          <p class="hint nav-hint">
            {step.part === 'A' ? '모두 답하면 다음으로 넘어갈 수 있습니다.' : '두 역할을 모두 고르면 다음으로 넘어갈 수 있습니다.'}
          </p>
        )}
        <nav class="step-nav" aria-label="단계 이동">
          <button type="button" class="btn btn-secondary" onClick={prev}>
            이전
          </button>
          <button type="button" class="btn btn-primary" onClick={next} disabled={!complete}>
            {p.step === STEPS.length - 1 ? '결과 보기' : '다음'}
          </button>
        </nav>
      </div>
    </main>
  );
}
