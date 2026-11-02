import logoColor from '../assets/wv-logo.webp';
import logoWhite from '../assets/wv-logo-white.webp';

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

/** 로고 원본 크기(가로세로 비율을 지키려고 img에 넣는다) */
const LOGO_W = 414;
const LOGO_H = 84;

/**
 * 월드비전 로고(기관에서 받은 공식 파일). 밝은 면에는 남색 글자, 다크 모드에는 흰 글자 판을 쓴다.
 * 두 판 가운데 어느 쪽을 보일지는 CSS(.org-logo-light / .org-logo-dark)가 정한다. 인쇄는 늘 밝은 면.
 */
export function OrgLogo({ class: cls = '' }: { class?: string }) {
  return (
    <span class={`org-logo ${cls}`} role="img" aria-label="월드비전">
      <img class="org-logo-light" src={logoColor} alt="" width={LOGO_W} height={LOGO_H} draggable={false} />
      <img class="org-logo-dark" src={logoWhite} alt="" width={LOGO_W} height={LOGO_H} draggable={false} />
    </span>
  );
}

/** 인쇄물 맨 위에만 나오는 머리(화면의 머리줄은 인쇄에서 빠진다) */
export function PrintBrand() {
  return (
    <div class="print-brand" aria-hidden="true">
      <Wordmark />
      <OrgLogo />
    </div>
  );
}
