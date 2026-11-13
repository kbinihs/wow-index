import type { PhaseId } from '../team';
import type { Archetype } from '../types';
import { NAMES } from './profiles';

export const TEAM_INTRO =
  '팀원들이 보낸 팀 코드나 결과 링크를 모아 팀 구성을 봅니다. 붙여 넣거나 올린 내용은 이 화면에서만 쓰고 어디에도 저장하지 않습니다. 화면을 닫으면 사라지니, 남기려면 인쇄해 두세요.';

// ── 팀 링크 ────────────────────────────────────────────

export const LINK_BUTTON = '팀 링크 만들기';
export const LINK_HINT =
  '팀 이름을 적으면 링크가 만들어집니다. 이 링크로 시작한 팀원은 결과에 팀 이름이 붙습니다. 팀원이 결과 화면에서 \'팀 대화방에 보내기\'를 누르면, 그 대화방 내용을 \'팀 결과 모아 보기\'에 통째로 붙여 넣어 모을 수 있습니다.';

// ── 모으기 ─────────────────────────────────────────────

export const PASTE_LABEL = '팀 코드, 결과 링크, 또는 대화방 내용';
export const PASTE_HINT = '대화방 내용을 통째로 복사해 붙여 넣어도 됩니다. 코드가 없는 줄(인사말, 이름, 시각)은 건너뜁니다.';
export const FILE_LABEL = '대화 내보내기 파일 올리기(.txt)';
export const FILE_HINT = '카카오톡의 \'대화 내보내기\'로 저장한 파일을 올리면 그 안의 코드를 모두 읽습니다. 파일은 이 화면에서만 읽습니다.';

/** '7번째 줄', 'chat.txt 7번째 줄', '3, 5번째 줄' */
export const lineLabel = (source: string | null, line: number | number[]) => {
  const n = Array.isArray(line) ? line.join(', ') : line;
  return source ? `${source} ${n}번째 줄` : `${n}번째 줄`;
};

export const replacedText = (nick: string, count: number, used: string) =>
  `'${nick}'의 코드가 ${count}개라 마지막 것(${used})만 썼습니다.`;

export const skippedText = (n: number) => `코드가 없는 줄 ${n}개는 건너뛰었습니다.`;

// ── 팀 고르기 ──────────────────────────────────────────

export const TEAM_PICK_QUESTION = '어느 팀을 볼까요?';
export const TEAM_NONE_LABEL = '팀 이름 없음';
export const TEAM_ALL_LABEL = '모두';

export const BALANCE_TITLE = '다섯 방식의 균형';
export const BALANCE_HINT = '꼭짓점이 바깥에 있을수록 그 방식을 주·보조 유형으로 가진 팀원이 많습니다.';
export const EVEN_NOTE = '점선은 다섯 방식이 똑같이 나뉘었을 때의 모양입니다.';
export const PHASE_NOTE =
  '점선은 Boris Cherny가 이 단계에 필요하다고 꼽은 방식에 팀원들의 주·보조 자리를 고르게 나눈 모양입니다(약간 필요한 방식은 절반). 비율은 이 도구가 정했고, 원글도 검증된 기준이 아닌 개인 의견이니 참고로만 보세요.';
export const BALANCE_EVEN = '다섯 방식이 고르게 들어 있습니다.';
export const BALANCE_MOST = '많은 쪽';
export const BALANCE_LEAST = '적은 쪽';

export const PHASE_QUESTION = '이 팀이 맡은 사업은 주로 어느 단계인가요?';
export const PHASE_TEXT: Record<PhaseId | 'none', { label: string; desc: string }> = {
  none: { label: '정하지 않음', desc: '다섯 방식이 똑같이 나뉜 모양과 비교' },
  new: { label: '새 사업', desc: '효과를 아직 확인하는 중인 새 사업·시범 사업' },
  growing: { label: '확대 중인 사업', desc: '효과가 확인되어 넓혀 가는 사업' },
  mature: { label: '안정기 사업', desc: '자리 잡아 오래 운영하는 사업' },
};
export const EVEN_LEGEND = '똑같이 나뉘었을 때';
export const phaseLegend = (id: PhaseId) => `${PHASE_TEXT[id].label}에 필요한 조합`;

export const GAP_LABELS = {
  need: '이 단계에 필요한 방식',
  some: '약간 필요한 방식',
  fewest: '필요한데 가장 적은 방식',
  outside: '이 단계 조합 밖의 방식',
} as const;

/** 'Prototyper(주 2명 · 보조 1명)', 아무도 없으면 'Maintainer(없음)' */
export function countLabel(a: Archetype, core: number, second: number): string {
  if (core + second === 0) return `${NAMES[a]}(없음)`;
  const parts = [core && `주 ${core}명`, second && `보조 ${second}명`].filter(Boolean);
  return `${NAMES[a]}(${parts.join(' · ')})`;
}

/** 팀원이 다섯 명보다 적으면 주 유형만으로는 다섯 방식을 다 채울 수 없다 */
export function smallTeamText(n: number): string {
  return `팀원이 ${n}명이라 한 사람의 결과에 따라 모양이 크게 달라집니다.`;
}
