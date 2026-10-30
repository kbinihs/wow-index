import type { Archetype } from '../types';

export interface Item {
  id: string;
  archetype: Archetype;
  /** 원글 정의 가운데 이 문항이 맡은 부분(파일럿 분석에서 문항을 해석할 때 쓴다) */
  facet: string;
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

/**
 * 원형마다 원글(Boris Cherny) 정의를 네 갈래로 나눠 한 문항씩 맡긴다.
 * - 한 문항에 한 가지 행동만 담는다.
 * - 직무와 상관없이 답할 수 있게 '사업·업무·서비스', '이용하는 사람'처럼 쓴다.
 * - 이웃 원형과 헷갈리지 않게 경계를 문구에 넣는다.
 *   Builder는 '처음 만드는 것', Maintainer는 '오래 운영 중인 것'.
 *   Sweeper는 '빼서' 빠르게, Maintainer는 '커져도' 느려지지 않게.
 *   Sweeper는 덜어 내고, Grower는 맞는 쪽을 키운다.
 */
export const ITEMS: readonly Item[] = [
  // Prototyper: comes up with brand new ideas; churns out many ideas, most of which don't ship
  { id: 'A01', archetype: 'P', facet: '아이디어의 양', text: '한 가지 문제에 서로 다른 해결 아이디어를 여러 개 내 보기' },
  { id: 'A02', archetype: 'P', facet: '처음 보는 새로움', text: '지금까지 아무도 해 보지 않은 방식을 떠올려 보기' },
  { id: 'A03', archetype: 'P', facet: '빠르게 만들어 보기', text: '떠오른 아이디어를 간단한 초안이나 작은 시범으로 바로 만들어 보기' },
  { id: 'A04', archetype: 'P', facet: '버려져도 괜찮음', text: '채택되지 않을 가능성이 높아도 새로운 안을 계속 시도해 보기' },
  // Builder: quickly turns a prototype/idea into production-grade product/infra
  { id: 'A05', archetype: 'B', facet: '빠른 실현', text: '가능성이 확인된 아이디어를 정식 사업이나 업무로 빠르게 옮기기' },
  { id: 'A06', archetype: 'B', facet: '실제로 시작', text: '새로 시작하는 일에 필요한 예산·인력·승인을 갖춰 실제로 시작되게 하기' },
  { id: 'A07', archetype: 'B', facet: '정식 운영 수준', text: '시범 때 임시로 처리하던 부분을 정식 운영에 맞게 제대로 만들기' },
  { id: 'A08', archetype: 'B', facet: '체계 갖추기', text: '새 일이 돌아가는 데 필요한 업무 절차와 시스템을 처음부터 갖추기' },
  // Sweeper: cleans up the UI, simplifies the code and system, unships, optimizes performance
  { id: 'A09', archetype: 'S', facet: '걷어 내기', text: '효과가 적은 활동이나 서비스를 찾아 그만두자고 제안하기' },
  { id: 'A10', archetype: 'S', facet: '단순하게 하기', text: '늘어난 보고서·양식·회의 가운데 없어도 되는 것을 찾아 줄이기' },
  { id: 'A11', archetype: 'S', facet: '보이는 것 다듬기', text: '사람들이 보는 안내문·양식·화면을 더 알기 쉽고 깔끔하게 다듬기' },
  { id: 'A12', archetype: 'S', facet: '빠르게 하기', text: '오래 걸리는 처리 과정에서 없어도 되는 단계를 빼 더 빠르게 만들기' },
  // Grower: takes a product that has been built and iterates on it to improve Product-Market Fit
  { id: 'A13', archetype: 'G', facet: '반응 모으기', text: '진행 중인 일에 대해 이용하는 사람들의 반응과 의견을 모아 보기' },
  { id: 'A14', archetype: 'G', facet: '더 잘 맞게 고치기', text: '반응과 결과 자료를 보고 사람들에게 덜 맞는 부분을 고치기' },
  { id: 'A15', archetype: 'G', facet: '되풀이해 개선', text: '작은 개선을 여러 번 되풀이해 결과를 조금씩 끌어올리기' },
  { id: 'A16', archetype: 'G', facet: '잘 맞는 점 키우기', text: '사람들이 다시 찾거나 계속 참여하는 이유를 찾아 그 부분을 키우기' },
  // Maintainer: owns a mature system to make it secure, reliable, fast, and efficient as it scales
  { id: 'A17', archetype: 'M', facet: '맡아서 책임지기', text: '몇 년째 이어 온 사업이나 시스템을 맡아 책임지고 운영하기' },
  { id: 'A18', archetype: 'M', facet: '안전', text: '개인정보·회계·안전 기준이 지켜지는지 점검하고 빈틈을 막기' },
  { id: 'A19', archetype: 'M', facet: '멈추지 않게', text: '잘 돌아가는 일에서 문제가 생길 징후를 일찍 알아채고 대비하기' },
  { id: 'A20', archetype: 'M', facet: '커져도 효율', text: '이용하는 사람이 늘어도 운영 비용과 처리 시간이 크게 늘지 않게 관리하기' },
];
