import type { Archetype } from '../types';

export interface Item {
  id: string;
  archetype: Archetype;
  text: string;
}

export const A_GUIDE = '지금 맡고 있는지, 잘하는지와 상관없이 이 일을 맡는다면 얼마나 끌리는지 고르세요.';

export const LIKERT_LABELS = [
  '전혀 끌리지 않는다',
  '별로 끌리지 않는다',
  '보통이다',
  '끌린다',
  '매우 끌린다',
] as const;

export const ITEMS: readonly Item[] = [
  { id: 'A01', archetype: 'P', text: '아직 답이 정해지지 않은 문제에 서로 다른 아이디어를 여러 개 내 보기' },
  { id: 'A02', archetype: 'P', text: '아무도 해 보지 않은 새로운 사업이나 방식을 떠올려 보기' },
  { id: 'A03', archetype: 'P', text: '아이디어를 간단한 초안이나 작은 시범으로 빠르게 만들어 보기' },
  { id: 'A04', archetype: 'P', text: '대부분 채택되지 않더라도 새 아이디어를 계속 내 보기' },
  { id: 'A05', archetype: 'B', text: '시범으로 해 본 아이디어를 정식 사업으로 빠르게 만들어 내기' },
  { id: 'A06', archetype: 'B', text: '새 사업에 필요한 예산·인력·협약을 갖춰 실제로 시작하게 하기' },
  { id: 'A07', archetype: 'B', text: '임시로 돌아가던 방식을 누가 맡아도 제대로 돌아가는 체계로 만들기' },
  { id: 'A08', archetype: 'B', text: '작게 해 본 방식을 많은 사람이 써도 문제없는 수준으로 완성하기' },
  { id: 'A09', archetype: 'S', text: '효과가 없는 활동을 찾아 그만두거나 합치자고 제안하기' },
  { id: 'A10', archetype: 'S', text: '늘어난 보고서·양식·회의를 검토해 줄일 부분 찾기' },
  { id: 'A11', archetype: 'S', text: '참여자·후원자가 보는 안내문과 신청 절차를 알기 쉽고 깔끔하게 다듬기' },
  { id: 'A12', archetype: 'S', text: '단계가 많아 오래 걸리는 처리 과정을 찾아 줄이고 빠르게 만들기' },
  { id: 'A13', archetype: 'G', text: '진행 중인 사업에 대한 참여자·후원자·동료의 반응을 모아 살펴보기' },
  { id: 'A14', archetype: 'G', text: '결과 자료를 보고 효과가 약한 지점을 찾아 고치기' },
  { id: 'A15', archetype: 'G', text: '작은 개선을 여러 번 되풀이해 결과를 조금씩 끌어올리기' },
  { id: 'A16', archetype: 'G', text: '사람들이 다시 찾거나 계속 참여하는 이유를 찾아 더 키우기' },
  { id: 'A17', archetype: 'M', text: '오래 운영해 온 사업이나 시스템을 책임지고 맡아 안정적으로 돌아가게 하기' },
  { id: 'A18', archetype: 'M', text: '개인정보·회계·안전 기준에 빈틈이 없는지 점검하고 막기' },
  { id: 'A19', archetype: 'M', text: '잘 돌아가는 일에서 작은 문제의 징후를 일찍 찾아내기' },
  { id: 'A20', archetype: 'M', text: '규모가 커져도 비용과 처리 시간이 늘지 않도록 운영 방식을 손보기' },
];
