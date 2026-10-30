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
  { id: 'A01', archetype: 'P', text: '아직 답이 정해지지 않은 문제에 대해 서로 다른 초안을 여러 개 만들어 보기' },
  { id: 'A02', archetype: 'P', text: '새 협력 아이디어를 한 장으로 정리해 동료나 파트너의 반응을 먼저 들어 보기' },
  { id: 'A03', archetype: 'P', text: '아무도 해 보지 않은 방식이 가능한지 작게 시험해 보기' },
  { id: 'A04', archetype: 'P', text: '완성도보다 속도를 앞세워 아이디어를 눈에 보이는 형태로 빨리 만들기' },
  { id: 'A05', archetype: 'B', text: '정해진 아이디어를 예산·일정·협약으로 나눠 실행 계획 세우기' },
  { id: 'A06', archetype: 'B', text: '다른 사람이 따라 할 수 있는 업무 흐름과 절차 설계하기' },
  { id: 'A07', archetype: 'B', text: '새 사업을 본격적으로 운영할 수 있도록 인력·역할·승인 구조 짜기' },
  { id: 'A08', archetype: 'B', text: '실행 전에 예외 상황과 위험 요소를 찾아 대비책 마련하기' },
  { id: 'A09', archetype: 'S', text: '효과가 없는 활동을 찾아 그만두거나 합치자고 제안하기' },
  { id: 'A10', archetype: 'S', text: '늘어난 보고서·양식·회의를 검토해 줄일 부분 찾기' },
  { id: 'A11', archetype: 'S', text: '복잡해진 업무 방식을 단순하게 다시 정리하기' },
  { id: 'A12', archetype: 'S', text: '사업이 끝난 뒤에도 성과가 남도록 마무리 계획 세우기' },
  { id: 'A13', archetype: 'G', text: '진행 중인 일에서 참여자·이용자·동료의 반응을 모아 살펴보기' },
  { id: 'A14', archetype: 'G', text: '결과 자료를 보고 효과가 약한 지점을 찾아 고치기' },
  { id: 'A15', archetype: 'G', text: '작은 개선을 여러 번 되풀이해 결과를 조금씩 끌어올리기' },
  { id: 'A16', archetype: 'G', text: '사람들이 다시 찾거나 계속 참여하는 이유를 찾아 더 키우기' },
  { id: 'A17', archetype: 'M', text: '이미 돌아가는 일을 정기적으로 점검하고 유지하기' },
  { id: 'A18', archetype: 'M', text: '정해진 마감과 품질 기준에 맞춰 꾸준히 처리하기' },
  { id: 'A19', archetype: 'M', text: '잘 돌아가는 일에서 작은 문제의 징후를 일찍 찾아내기' },
  { id: 'A20', archetype: 'M', text: '오래 이어지는 파트너 관계와 운영 체계를 안정적으로 관리하기' },
];
