/** 제목 글자: WoW의 o를 고리로 쓴다 */
export const TITLE = 'WoW Index';
export const TITLE_SUB = 'Ways of Working';

export function Wordmark({ class: cls = '' }: { class?: string }) {
  return (
    <span class={`wordmark ${cls}`}>
      <span class="sr-only">{TITLE}</span>
      <span aria-hidden="true">
        W<span class="wordmark-o" />W<span class="wordmark-index"> Index</span>
      </span>
    </span>
  );
}

/**
 * 첫 화면 오른쪽 위 장식. 다섯 방식을 뜻하는 오각형을 세 겹으로 겹치고(팀 화면 오각형과 같은 모양),
 * 안쪽 꼭짓점 다섯에 점을 찍는다. 처음 열릴 때 선이 그려지고 점이 차례로 찍힌다.
 */
export function PentaDeco() {
  return (
    <svg class="hero-deco" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <path class="deco-ring deco-ring-1" pathLength={1} d="M300.0,30.0 L366.6,78.4 L341.1,156.6 L258.9,156.6 L233.4,78.4 Z" />
      <path class="deco-ring deco-ring-2" pathLength={1} d="M300.0,-40.0 L433.1,56.7 L382.3,213.3 L217.7,213.3 L166.9,56.7 Z" />
      <path class="deco-ring deco-ring-3" pathLength={1} d="M300.0,-110.0 L499.7,35.1 L423.4,269.9 L176.6,269.9 L100.3,35.1 Z" />
      <circle class="deco-dot" style={{ "--i": 0 }} cx="300.0" cy="30.0" r="7" />
      <circle class="deco-dot" style={{ "--i": 1 }} cx="366.6" cy="78.4" r="7" />
      <circle class="deco-dot" style={{ "--i": 2 }} cx="341.1" cy="156.6" r="7" />
      <circle class="deco-dot" style={{ "--i": 3 }} cx="258.9" cy="156.6" r="7" />
      <circle class="deco-dot" style={{ "--i": 4 }} cx="233.4" cy="78.4" r="7" />
    </svg>
  );
}

/** 인쇄물 맨 위에만 나오는 머리(화면의 머리줄은 인쇄에서 빠진다) */
export function PrintBrand() {
  return (
    <div class="print-brand" aria-hidden="true">
      <Wordmark />
    </div>
  );
}
