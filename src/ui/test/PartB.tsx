import { B_GUIDE, B_GUIDE_SHORT, SCENARIOS } from '../../data/scenarios';
import { tapRole, type RoleChoice as Choice } from '../../progress';
import type { Archetype } from '../../types';
import { announce, Emph } from '../common';

export const BEST_LABEL = '가장 맡고 싶음';
export const WORST_LABEL = '가장 맡고 싶지 않음';

export function PartB({
  index,
  order,
  choice,
  onChange,
}: {
  index: number;
  order: Archetype[];
  choice: Choice;
  onChange: (c: Choice) => void;
}) {
  const sc = SCENARIOS[index];

  const tap = (a: Archetype) => {
    const next = tapRole(choice, a);
    onChange(next);
    // 역할 문장은 누른 버튼의 이름으로 이미 읽히므로 바뀐 상태와 다음 할 일만 알린다
    if (next.best === a)
      announce(next.worst === null ? '가장 맡고 싶은 역할로 골랐습니다. 이제 가장 맡고 싶지 않은 역할을 고르세요.' : '가장 맡고 싶은 역할로 골랐습니다.');
    else if (next.worst === a) announce('가장 맡고 싶지 않은 역할로 골랐습니다.');
    else announce('선택을 취소했습니다.');
  };

  const phase = choice.best === null ? 'best' : choice.worst === null ? 'worst' : 'done';
  const now =
    phase === 'best'
      ? '먼저 가장 맡고 싶은 역할을 고르세요.'
      : phase === 'worst'
        ? '이제 가장 맡고 싶지 않은 역할을 고르세요.'
        : "고른 역할을 다시 누르면 선택이 취소됩니다. 다른 역할을 누르면 '가장 맡고 싶지 않은 역할'이 그 역할로 바뀝니다.";

  return (
    <>
      <p class="guide">
        {index === 0 ? <Emph text={B_GUIDE} bold={['내가 가장 맡고 싶은 역할', '가장 맡고 싶지 않은 역할']} /> : B_GUIDE_SHORT}
      </p>
      <p class="situation">
        <span class="situation-id">{sc.id}</span>
        {sc.situation}
      </p>
      <ol class="pick-steps" aria-hidden="true">
        <li class={`pick-step pick-step-best${phase === 'best' ? ' is-now' : ''}${choice.best ? ' is-set' : ''}`}>
          <span class="pick-num">1</span>가장 맡고 싶은 역할
        </li>
        <li class={`pick-step pick-step-worst${phase === 'worst' ? ' is-now' : ''}${choice.worst ? ' is-set' : ''}`}>
          <span class="pick-num">2</span>가장 맡고 싶지 않은 역할
        </li>
      </ol>
      <p class="pick-now" id="b-now">
        {now}
      </p>
      <ul class="roles">
        {order.map((a) => {
          const state = choice.best === a ? 'best' : choice.worst === a ? 'worst' : null;
          const badge = state === 'best' ? BEST_LABEL : state === 'worst' ? WORST_LABEL : null;
          return (
            <li key={a}>
              <button
                type="button"
                data-role={a}
                class={`role${state ? ` role-${state}` : ''}`}
                aria-label={badge ? `${sc.roles[a]}, ${badge}` : sc.roles[a]}
                aria-describedby="b-now"
                onClick={() => tap(a)}
              >
                <span class="role-text">{sc.roles[a]}</span>
                {badge && (
                  <span class={`badge badge-${state}`} aria-hidden="true">
                    {badge}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
