/** 제목 글자: WoW의 o를 오렌지 고리로 쓴다 */
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
 * 브랜드의 Horizon(주황 원호)을 따른 배경 장식. 처음 열릴 때 원호가 그려지며 펼쳐진다.
 */
export function Horizon() {
  return (
    <svg class="horizon" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="horizon-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff7a38" />
          <stop offset="0.55" stop-color="#ff5515" />
          <stop offset="1" stop-color="#f14014" />
        </linearGradient>
      </defs>
      <path class="horizon-arc horizon-arc-1" pathLength={1} d="M110,0 A290,290 0 0 0 400,290" />
      <path class="horizon-arc horizon-arc-2" pathLength={1} d="M230,0 A170,170 0 0 0 400,170" />
    </svg>
  );
}
