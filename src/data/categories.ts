import type { Archetype } from '../types';

/** 결과 문장에서 쓰는 일 이름 */
const WORK_NAMES: Record<Archetype, string> = {
  P: '새로운 것을 시도하는 일',
  B: '실행 체계를 만드는 일',
  S: '줄이고 끝내는 일',
  G: '진행 중인 일을 고치는 일',
  M: '돌아가는 일을 지키는 일',
};

/** 역할로 말할 때의 이름('일' → '역할') */
const ROLE_NAMES: Record<Archetype, string> = {
  P: '새로운 것을 시도하는 역할',
  B: '실행 체계를 만드는 역할',
  S: '줄이고 끝내는 역할',
  G: '진행 중인 일을 고치는 역할',
  M: '돌아가는 일을 지키는 역할',
};

export function workName(a: Archetype): string {
  return WORK_NAMES[a];
}

export function roleName(a: Archetype): string {
  return ROLE_NAMES[a];
}
