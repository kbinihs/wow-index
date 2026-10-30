import { useId } from 'preact/hooks';
import type { Archetype } from '../types';

/**
 * 유형별 문양. 방패 위에 문장학의 '분할'(바탕 나누기)과 '문장'(상징)을 하나씩 얹는다.
 * - Prototyper: 대각 분할 + 한 점에서 여러 갈래로 뻗는 선(작게 여러 번 시도)
 * - Builder: 가로 분할(아래가 토대) + 쌓아 올린 블록(체계를 세움)
 * - Sweeper: 반대 대각 분할 + 깔때기와 한 방울(걸러서 핵심만 남김)
 * - Grower: 셰브런(올라가는 띠) + 새싹(키움)
 * - Maintainer: 테두리 띠(지킴) + 닻(흔들리지 않음)
 * 색은 브랜드 기본색(Orange·Midnight)과 Field 100만 쓴다.
 */

const SHIELD = 'M10,8 H90 V52 C90,84 70,104 50,114 C30,104 10,84 10,52 Z';

function Division({ a }: { a: Archetype }) {
  switch (a) {
    case 'P':
      return <polygon class="crest-div" points="10,8 90,8 90,120" />;
    case 'S':
      return <polygon class="crest-div" points="10,8 90,8 10,120" />;
    case 'B':
      return <rect class="crest-div" x="0" y="66" width="100" height="60" />;
    case 'G':
      return <polygon class="crest-div" points="0,112 50,58 100,112 100,88 50,34 0,88" />;
    case 'M':
      return <path class="crest-div crest-bordure" d={SHIELD} />;
  }
}

function Charge({ a }: { a: Archetype }) {
  switch (a) {
    case 'P':
      return (
        <g class="crest-charge">
          <path pathLength={1} d="M50,86 L28,46 M50,86 L50,36 M50,86 L72,46" />
          <circle class="crest-hollow" cx="28" cy="42" r="6" />
          <circle class="crest-solid" cx="50" cy="32" r="7" />
          <circle class="crest-hollow" cx="72" cy="42" r="6" />
          <circle class="crest-solid" cx="50" cy="88" r="4" />
        </g>
      );
    case 'S':
      return (
        <g class="crest-charge">
          <path pathLength={1} d="M24,34 H76 L56,62 V78 H44 V62 Z" />
          <path pathLength={1} d="M38,44 H62" />
          <circle class="crest-solid" cx="50" cy="92" r="6" />
        </g>
      );
    case 'B':
      return (
        <g class="crest-charge">
          <rect class="crest-block" x="23" y="78" width="16" height="13" rx="2" />
          <rect class="crest-block" x="42" y="78" width="16" height="13" rx="2" />
          <rect class="crest-block" x="61" y="78" width="16" height="13" rx="2" />
          <rect class="crest-block" x="32.5" y="62" width="16" height="13" rx="2" />
          <rect class="crest-block" x="51.5" y="62" width="16" height="13" rx="2" />
          <rect class="crest-block" x="42" y="46" width="16" height="13" rx="2" />
          <path pathLength={1} d="M50,40 V26 M50,26 L62,31 L50,36" />
        </g>
      );
    case 'G':
      return (
        <g class="crest-charge">
          <path pathLength={1} d="M50,94 V50 M34,94 H66" />
          <path class="crest-solid" d="M50,72 C37,72 30,64 30,52 C42,52 50,58 50,72 Z" />
          <path class="crest-solid" d="M50,60 C63,60 70,52 70,40 C58,40 50,46 50,60 Z" />
        </g>
      );
    case 'M':
      return (
        <g class="crest-charge">
          <circle class="crest-ring" cx="50" cy="34" r="6" />
          <path pathLength={1} d="M50,40 V90 M38,52 H62 M30,74 C32,86 42,91 50,91 C58,91 68,86 70,74" />
        </g>
      );
  }
}

export function Crest({
  archetype,
  size = 64,
  animate = false,
  title,
  x,
  y,
}: {
  archetype: Archetype;
  size?: number;
  animate?: boolean;
  /** 있으면 그림으로 읽히고, 없으면 바로 옆에 이름이 있으므로 스크린리더에서 숨긴다 */
  title?: string;
  /** 다른 SVG 안에 넣을 때의 위치 */
  x?: number;
  y?: number;
}) {
  // 한 화면에 같은 문양이 여러 번 나와도 id가 겹치지 않게 한다
  const id = `crest-clip-${archetype}-${useId()}`;
  return (
    <svg
      class={`crest crest-${archetype}${animate ? ' crest-animate' : ''}`}
      width={size}
      height={size * 1.2}
      x={x}
      y={y}
      viewBox="0 0 100 120"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      <defs>
        <clipPath id={id}>
          <path d={SHIELD} />
        </clipPath>
      </defs>
      <path class="crest-field" d={SHIELD} />
      <g clip-path={`url(#${id})`}>
        <Division a={archetype} />
      </g>
      <Charge a={archetype} />
      <path class="crest-outline" d={SHIELD} />
    </svg>
  );
}
