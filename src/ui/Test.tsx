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

export function Test() {
  const [p, setP] = useState<Progress>(() => {
    const saved = loadProgress();
    if (saved && !saved.finishedAt) return saved;
    const fresh = newProgress();
    saveProgress(fresh);
    return fresh;
  });
  const placement = placementOf(p);
  const pending = p.step >= STEPS.length ? placement?.pending ?? null : null;
  const heading = useFocusHeading(`${p.step}-${pending?.slot ?? ''}`);
  const enteredAt = useRef(Date.now());

  useEffect(() => {
    enteredAt.current = Date.now();
  }, [p.step, pending?.slot]);

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
    const done = { ...withTime(q), finishedAt: new Date().toISOString() };
    saveProgress(done);
    setP(done);
    navigate(resultHash(encode(summary)));
  };

  const go = (to: number) => update((q) => ({ ...withTime(q), step: to }));

  const prev = () => {
    if (p.step === 0) {
      update(withTime);
      navigate('#/');
    } else go(Math.min(p.step, STEPS.length) - 1);
  };

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

  if (p.step >= STEPS.length) {
    if (!pending) {
      // 답을 바꿔 동점이 풀렸으면 바로 결과로
      return (
        <main class="page test">
          <h1 ref={heading} tabIndex={-1}>
            결과를 정리하고 있습니다
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
  const title = step.part === 'A' ? `업무 선호 (${step.page + 1}/5)` : `상황 선택 (${step.index + 1}/6)`;

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
          onAnswer={(id, v) => update((q) => ({ ...q, a: { ...q.a, [id]: v } }))}
        />
      )}
      {step.part === 'B' && (
        <PartB
          index={step.index}
          order={p.bOrder[step.index]}
          choice={p.b[step.index]}
          onChange={(c) => update((q) => ({ ...q, b: q.b.map((x, i) => (i === step.index ? c : x)) }))}
        />
      )}

      <div class="dock">
        {!complete && <p class="hint nav-hint">모두 답하면 다음으로 넘어갈 수 있습니다.</p>}
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
