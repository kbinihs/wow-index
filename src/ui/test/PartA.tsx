import { useRef } from 'preact/hooks';
import { A_GUIDE, ITEMS, LIKERT_LABELS } from '../../data/items';
import { Emph, prefersReducedMotion } from '../common';

const BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

/**
 * 16personalities처럼 한 문항에 동그라미 다섯 개. 양 끝으로 갈수록 크다.
 * 답하면 다음 문항으로 내려간다. 스크린리더에는 다섯 단계 이름을 모두 읽어 준다.
 */
export function PartA({
  ids,
  answers,
  onAnswer,
}: {
  ids: string[];
  answers: Record<string, number>;
  onAnswer: (id: string, value: number) => void;
}) {
  const refs = useRef<(HTMLFieldSetElement | null)[]>([]);
  const active = ids.findIndex((id) => answers[id] === undefined);

  const answer = (i: number, id: string, v: number) => {
    const first = answers[id] === undefined;
    onAnswer(id, v);
    if (!first) return;
    const next = ids.findIndex((x, j) => j > i && answers[x] === undefined);
    const target = next >= 0 ? refs.current[next] : document.querySelector<HTMLElement>('.step-nav');
    window.requestAnimationFrame(() =>
      target?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: next >= 0 ? 'center' : 'end' }),
    );
  };

  return (
    <>
      <p class="guide">
        <Emph text={A_GUIDE} bold={['이 일을 얼마나 맡고 싶은지']} />
      </p>
      {ids.map((id, i) => (
        <fieldset
          key={id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          class={`likert${i === active ? ' is-active' : ''}${answers[id] !== undefined ? ' is-done' : ''}`}
        >
          <legend class="likert-q">{BY_ID[id].text}</legend>
          <div class="likert-scale">
            {LIKERT_LABELS.map((label, k) => {
              const value = k + 1;
              return (
                <label class={`dot dot-${value}`} key={value}>
                  <input
                    type="radio"
                    name={id}
                    value={value}
                    aria-label={`${value} ${label}`}
                    checked={answers[id] === value}
                    onChange={() => answer(i, id, value)}
                  />
                  <span class="dot-face" aria-hidden="true" />
                </label>
              );
            })}
          </div>
          <div class="likert-ends" aria-hidden="true">
            <span>{LIKERT_LABELS[0]}</span>
            <span>{LIKERT_LABELS[4]}</span>
          </div>
        </fieldset>
      ))}
    </>
  );
}
