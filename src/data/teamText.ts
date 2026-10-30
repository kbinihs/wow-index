import type { Archetype } from '../types';
import { NAMES } from './profiles';

export const TEAM_INTRO =
  '팀원들이 보낸 팀 코드나 결과 링크를 한 줄에 하나씩 붙여 넣으세요. 붙여 넣은 내용은 이 화면에서만 쓰고 어디에도 저장하지 않습니다. 화면을 닫으면 사라지니, 남기려면 인쇄해 두세요.';

export const BALANCE_TITLE = '다섯 방식의 균형';
export const BALANCE_HINT =
  '꼭짓점이 바깥에 있을수록 그 방식을 주·보조 유형으로 가진 팀원이 많습니다. 점선은 다섯 방식이 똑같이 나뉘었을 때의 모양입니다.';
export const BALANCE_EVEN = '다섯 방식이 고르게 들어 있습니다.';
export const BALANCE_MOST = '많은 쪽';
export const BALANCE_LEAST = '적은 쪽';

/** 'Prototyper(주 2명 · 보조 1명)', 아무도 없으면 'Maintainer(없음)' */
export function countLabel(a: Archetype, core: number, second: number): string {
  if (core + second === 0) return `${NAMES[a]}(없음)`;
  const parts = [core && `주 ${core}명`, second && `보조 ${second}명`].filter(Boolean);
  return `${NAMES[a]}(${parts.join(' · ')})`;
}

/** 팀원이 다섯 명보다 적으면 주 유형만으로는 다섯 방식을 다 채울 수 없다 */
export function smallTeamText(n: number): string {
  return `팀원이 ${n}명이라 한 사람의 결과에 따라 모양이 크게 달라집니다.`;
}
