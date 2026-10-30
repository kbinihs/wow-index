import { josa } from '../text';
import type { Archetype } from '../types';
import { NAMES } from './profiles';

export const TEAM_INTRO =
  '팀원들이 보낸 팀 코드나 결과 링크를 한 줄에 하나씩 붙여 넣으세요. 붙여 넣은 내용은 이 화면에서만 쓰고 어디에도 저장하지 않습니다. 화면을 닫으면 사라지니, 남기려면 인쇄해 두세요.';

export const TASKS_HINT = '이번 분기 팀 업무를 3–7개 적고 각 업무의 단계를 고르세요. 업무마다 그 단계의 방식을 주·보조 유형으로 가진 팀원이 나옵니다. 담당을 고르면 담당자의 유형과 맞는지도 보입니다.';
export const TASKS_EMPTY = '업무를 적고 단계를 고르면 여기에 단계별 업무 수와 팀원 수가 나란히 나옵니다.';
export const STAGE_UNSET = '단계를 고르면 이 업무에 맞는 팀원이 나옵니다.';
export const NEED_CODES = '팀 코드를 불러오면 나옵니다';
export const BALANCE_NEED_CODES = '팀 코드를 불러오면 단계마다 팀원 수가 나옵니다.';

/** 담당자를 고른 업무에서, 업무 단계의 방식이 담당자에게 어떤 자리인지 */
export const FIT_TEXT = {
  core: '담당자의 주 유형과 같은 방식',
  second: '담당자의 보조 유형과 같은 방식',
  other: '담당자의 주·보조 유형이 아닌 방식',
} as const;

/** 업무 단계의 방식을 주·보조 유형으로 가진 팀원이 없을 때 */
export function noCoverText(stageLabel: string, count: number, a: Archetype): string {
  return `${stageLabel} 단계 업무가 ${count}개인데, ${josa(NAMES[a], '을', '를')} 주·보조 유형으로 가진 팀원이 없습니다. 누가 어떤 지원을 받아 맡을지 이야기해 볼 만합니다.`;
}

/** 업무가 2개 이상인 단계에서 그 방식을 가진 팀원이 한 명뿐일 때 */
export function onlyOneText(stageLabel: string, count: number, a: Archetype, name: string): string {
  return `${stageLabel} 단계 업무가 ${count}개인데, ${josa(NAMES[a], '을', '를')} 주·보조 유형으로 가진 팀원은 ${name} 한 명입니다.`;
}

/** 그 방식을 주 유형으로 가진 팀원은 있는데 이번 분기 업무에 그 단계가 없을 때 */
export function noTaskText(stageLabel: string, a: Archetype, count: number): string {
  return `${josa(NAMES[a], '을', '를')} 주 유형으로 가진 팀원이 ${count}명인데, 이번 분기 업무 가운데 ${stageLabel} 단계는 없습니다.`;
}
