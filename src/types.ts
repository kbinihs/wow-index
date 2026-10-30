export type Archetype = 'P' | 'B' | 'S' | 'G' | 'M';

/** 동점 정렬의 마지막 기준이기도 한 고정 순서 */
export const ARCHETYPES: readonly Archetype[] = ['P', 'B', 'S', 'G', 'M'];

export type Likert = 1 | 2 | 3 | 4 | 5;

export interface BChoice {
  best: Archetype;
  worst: Archetype;
}

/** 1·2위가 A 평균과 B 횟수로도 갈리지 않을 때 본인이 고른 것 */
export interface Picks {
  core?: Archetype;
  second?: Archetype;
}

/**
 * 결과 계산에 필요한 응답 요약. 결과 링크·팀 코드에 담기는 것도 이것이다.
 * A는 문항별 응답 대신 원형별 4문항 합계(4–20)만 가진다.
 */
export interface Summary {
  aSum: Record<Archetype, number>;
  /** B1–B6 순서 */
  b: BChoice[];
  picks: Picks;
}
