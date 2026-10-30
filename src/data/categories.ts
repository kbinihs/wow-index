import type { Archetype } from '../types';

/** 결과 문장에서 쓰는 일 이름 */
const WORK_NAMES: Record<Archetype, string> = {
  P: '새 아이디어를 내고 만들어 보는 일',
  B: '아이디어를 실제 사업으로 만드는 일',
  S: '다듬고 덜어 내는 일',
  G: '시작한 일을 반응을 보며 키우는 일',
  M: '자리 잡은 일을 튼튼하게 지키는 일',
};

/** 역할로 말할 때의 이름('일' → '역할') */
const ROLE_NAMES: Record<Archetype, string> = {
  P: '새 아이디어를 내고 만들어 보는 역할',
  B: '아이디어를 실제 사업으로 만드는 역할',
  S: '다듬고 덜어 내는 역할',
  G: '시작한 일을 반응을 보며 키우는 역할',
  M: '자리 잡은 일을 튼튼하게 지키는 역할',
};

export function workName(a: Archetype): string {
  return WORK_NAMES[a];
}

export function roleName(a: Archetype): string {
  return ROLE_NAMES[a];
}
