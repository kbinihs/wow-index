import type { Archetype, BChoice, Summary } from '../src/types';

export const pairs = (...codes: string[]): BChoice[] =>
  codes.map((c) => ({ best: c[0] as Archetype, worst: c[1] as Archetype }));
/** 원형별 평균 → 합계 */
export const sums = (P: number, B: number, S: number, G: number, M: number) => ({ P: P * 4, B: B * 4, S: S * 4, G: G * 4, M: M * 4 });

/**
 * 예시 1의 A·B. 원래 예시에는 집계값만 있어 그 값이 나오는 응답을 구성했다.
 * A: P 5·5·4·4=18, B 3·3·3·3=12, S 5·4·4·4=17, G 3·3·3·2=11, M 2·2·2·2=8
 * B: best P3·B1·S2, worst B1·S1·G1·M3
 */
export const EX1_RESPONSES: Record<string, number> = {
  A01: 5, A02: 5, A03: 4, A04: 4,
  A05: 3, A06: 3, A07: 3, A08: 3,
  A09: 5, A10: 4, A11: 4, A12: 4,
  A13: 3, A14: 3, A15: 3, A16: 2,
  A17: 2, A18: 2, A19: 2, A20: 2,
};

export const EX1: Summary = {
  aSum: { P: 18, B: 12, S: 17, G: 11, M: 8 },
  b: pairs('PM', 'PM', 'PM', 'BS', 'SB', 'SG'),
  picks: {},
};

export function makeSummary(over: Partial<Summary> = {}): Summary {
  return { aSum: sums(4, 3.5, 3, 2.5, 2), b: pairs('PM', 'BS', 'SG', 'GM', 'MP', 'PB'), picks: {}, ...over };
}
