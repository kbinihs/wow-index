import type { Archetype } from '../types';

export interface Item {
  id: string;
  archetype: Archetype;
  /** 원글 정의 가운데 이 문항이 맡은 부분(파일럿 분석에서 문항을 해석할 때 쓴다) */
  facet: string;
  text: string;
}

export const A_GUIDE = '지금 맡고 있는지, 잘하는지와 상관없이 이 일을 얼마나 맡고 싶은지 고르세요.';

export const LIKERT_LABELS = [
  '전혀 맡고 싶지 않다',
  '별로 맡고 싶지 않다',
  '보통이다',
  '맡고 싶다',
  '매우 맡고 싶다',
] as const;

/**
 * 원형마다 원글(Boris Cherny) 정의를 네 갈래로 나눠 한 문항씩 맡긴다.
 * - 한 문항에 한 가지 행동만 담는다. 같은 원형의 네 문항은 서로 다른 행동을 묻는다.
 * - 직무·직급과 상관없이 답할 수 있게 쓴다. 승인·예산·중단 결정처럼 결정권이 있어야 하는 일로 읽히지 않게 하고,
 *   '사업·업무·서비스', '이용하는 사람'처럼 쓴다.
 * - '아무도 해 보지 않은'처럼 답하기 어려운 절대어는 쓰지 않는다.
 * - 이웃 원형과 헷갈리지 않게 경계를 문구에 넣는다.
 *   Builder는 '계획·시범 → 정식', Maintainer는 '몇 년째·오래·많아져도'.
 *   Sweeper는 '빼서·덜어 내·중단'으로 가볍고 빠르게, Grower는 '반응·더 잘 맞게·키우'로 맞는 쪽을 키운다.
 * - 20–38자, '~기'로 끝나는 쉬운 말(tests/items.test.ts가 지킨다).
 */
export const ITEMS: readonly Item[] = [
  // Prototyper: comes up with brand new ideas; churns out many ideas, most of which don't ship
  { id: 'A01', archetype: 'P', facet: '아이디어의 양', text: '한 가지 문제에 서로 다른 해결 아이디어를 여러 개 내기' },
  { id: 'A02', archetype: 'P', facet: '처음 보는 새로움', text: '익숙한 방식 대신 아직 해 보지 않은 새 방법을 생각해 내기' },
  { id: 'A03', archetype: 'P', facet: '빠르게 만들어 보기', text: '떠오른 아이디어를 간단한 초안이나 작은 시범으로 바로 만들기' },
  { id: 'A04', archetype: 'P', facet: '버려져도 괜찮음', text: '채택되지 않을 가능성이 높아도 새로운 안을 계속 내놓기' },
  // Builder: quickly turns a prototype/idea into production-grade product/infra
  { id: 'A05', archetype: 'B', facet: '빠른 실현', text: '가능성이 확인된 아이디어를 정식 사업이나 업무로 빠르게 옮기기' },
  { id: 'A06', archetype: 'B', facet: '실제로 시작', text: '계획 단계에 있는 새 일을 실제 시작까지 이끌기' },
  { id: 'A07', archetype: 'B', facet: '정식 운영 수준', text: '시범 때 임시로 처리하던 부분을 정식 운영에 맞게 제대로 만들기' },
  { id: 'A08', archetype: 'B', facet: '체계 갖추기', text: '새 일이 돌아가는 데 필요한 업무 절차와 시스템을 처음부터 갖추기' },
  // Sweeper: cleans up the UI, simplifies the code and system, unships, optimizes performance
  { id: 'A09', archetype: 'S', facet: '걷어 내기', text: '효과가 적어 중단할 만한 활동이나 서비스를 골라내기' },
  { id: 'A10', archetype: 'S', facet: '단순하게 하기', text: '복잡하게 얽힌 업무 규칙을 꼭 필요한 것만 남겨 단순하게 정리하기' },
  { id: 'A11', archetype: 'S', facet: '보이는 것 다듬기', text: '사람들이 보는 안내문·양식·화면에서 군더더기를 덜어 내기' },
  { id: 'A12', archetype: 'S', facet: '빠르게 하기', text: '오래 걸리는 처리 과정에서 없어도 되는 단계를 빼서 더 빠르게 만들기' },
  // Grower: takes a product that has been built and iterates on it to improve Product-Market Fit
  // 네 갈래: 반응 묻기 → 안 맞는 부분 찾기 → 작은 개선 되풀이 → 잘 맞는 점 키우기
  { id: 'A13', archetype: 'G', facet: '반응 묻기', text: '진행 중인 일이 어떤지 이용하는 사람들에게 직접 물어보기' },
  { id: 'A14', archetype: 'G', facet: '안 맞는 부분 찾기', text: '반응과 결과 자료에서 사람들에게 잘 맞지 않는 부분을 찾아내기' },
  { id: 'A15', archetype: 'G', facet: '되풀이해 개선', text: '이용하는 사람들에게 더 잘 맞도록 작은 개선을 여러 번 되풀이하기' },
  { id: 'A16', archetype: 'G', facet: '잘 맞는 점 키우기', text: '사람들이 다시 찾아오거나 계속 참여하게 만든 점을 더 키우기' },
  // Maintainer: owns a mature system to make it secure, reliable, fast, and efficient as it scales
  { id: 'A17', archetype: 'M', facet: '맡아서 책임지기', text: '몇 년째 이어 온 사업이나 시스템을 맡아 책임지고 운영하기' },
  { id: 'A18', archetype: 'M', facet: '안전', text: '오래 운영해 온 일에서 정보 유출이나 사고로 이어질 빈틈을 찾아 막기' },
  { id: 'A19', archetype: 'M', facet: '멈추지 않게', text: '잘 돌아가는 일이 멈추지 않도록 문제가 생길 낌새를 미리 살피기' },
  { id: 'A20', archetype: 'M', facet: '커져도 효율', text: '이용하는 사람이 많아져도 비용과 처리 시간이 크게 늘지 않게 관리하기' },
];
