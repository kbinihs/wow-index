import type { Archetype } from '../types';

/** 결과 문장에서 쓰는 일 이름 */
const WORK_NAMES: Record<Archetype, string> = {
  P: '새 아이디어를 내고 만들어 보는 일',
  B: '아이디어를 실제 사업으로 만드는 일',
  S: '다듬고 덜어 내는 일',
  G: '진행 중인 사업을 반응에 맞춰 키우는 일',
  M: '자리 잡은 사업을 튼튼하게 지키는 일',
};

export function workName(a: Archetype): string {
  return WORK_NAMES[a];
}
