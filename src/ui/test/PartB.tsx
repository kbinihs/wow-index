import { B_GUIDE, SCENARIOS } from '../../data/scenarios';
import { tapRole, type RoleChoice as Choice } from '../../progress';
import type { Archetype } from '../../types';
import { josa } from '../../text';
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
    const role = sc.roles[a];
    if (next.best === a) announce(`${josa(role, '을', '를')} 가장 맡고 싶은 역할로 골랐습니다.`);
    else if (next.worst === a) announce(`${josa(role, '을', '를')} 가장 맡고 싶지 않은 역할로 골랐습니다.`);
    else announce(`${role} 선택을 취소했습니다.`);
  };

  const phase = choice.best === null ? 'best' : choice.worst === null ? 'worst' : 'done';
  const now =
    phase === 'best'
      ? '먼저 가장 맡고 싶은 역할을 고르세요.'
      : phase === 'worst'
        ? '이제 가장 맡고 싶지 않은 역할을 고르세요.'
        : '고른 것을 다시 누르면 바꿀 수 있습니다.';

  return (
    <>
      <p class="guide">
        <Emph text={B_GUIDE} bold={['내가 가장 맡고 싶은 역할', '가장 맡고 싶지 않은 역할']} />
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
      <ul class="roles" aria-describedby="b-now">
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
