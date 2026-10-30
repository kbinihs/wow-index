import { josa } from '../text';
import type { Archetype } from '../types';
import { NAMES } from './profiles';

export const TEAM_INTRO =
  '팀원들이 보낸 팀 코드나 결과 링크를 한 줄에 하나씩 붙여 넣으세요. 붙여 넣은 내용은 이 화면에서만 쓰고 어디에도 저장하지 않습니다. 화면을 닫으면 사라지니, 남기려면 인쇄해 두세요.';

export const TASKS_HINT = '이번 분기 팀 업무를 3–7개 적고 각 업무의 단계를 고르세요. 업무 단계와 팀 구성을 나란히 볼 수 있습니다.';
export const TASKS_EMPTY = '업무를 적고 단계를 고르면 여기에 업무 단계와 팀 구성이 나란히 나옵니다.';

/** 업무 단계의 방식을 주·보조 유형으로 가진 팀원이 없을 때 */
export function noCoverText(stageLabel: string, count: number, a: Archetype): string {
  return `${stageLabel} 단계 업무가 ${count}개인데, ${josa(NAMES[a], '을', '를')} 주·보조 유형으로 가진 팀원이 없습니다. 누가 어떤 지원을 받아 맡을지 이야기해 볼 만합니다.`;
}
