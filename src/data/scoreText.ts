/** 결과 화면 '점수 보기'의 문구. 계산 방법은 src/scoring.ts와 README의 '계산 방법'을 따른다. */

export const SCORE_VIEW_SUMMARY = '점수 보기';

export const SCORE_VIEW_TEXT =
  '합산 점수는 문항 4개 합계(4–20점)에, 상황에서 가장 맡고 싶다고 고를 때마다 1점을 더하고 가장 맡고 싶지 않다고 고를 때마다 1점을 뺀 값입니다. 이 점수가 높은 순서로 주 유형, 보조 유형, 성장 방향, 채워 줄 짝이 정해집니다.';

export const SCORE_TABLE_CAPTION = '다섯 방식의 문항 합계, 상황에서 고른 횟수, 합산 점수(합산 점수가 높은 순)';

export const SCORE_COLUMNS = {
  name: '방식',
  aSum: '문항 합계',
  best: '가장 맡고 싶음',
  worst: '가장 맡고 싶지 않음',
  composite: '합산',
} as const;

/** 음수는 하이픈 대신 빼기 기호(−)로 */
export const scoreCell = (n: number): string => (n < 0 ? `−${-n}` : String(n));

/** '가장 맡고 싶지 않음' 칸: 빼는 점수라 −n으로, 0은 0으로 */
export const worstCell = (n: number): string => scoreCell(-n);
