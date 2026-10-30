import { decode, extractCode, type DecodeError } from './codec';
import { bCounts, place } from './scoring';
import { ARCHETYPES, type Archetype, type Summary } from './types';

export interface Member {
  nick: string | null;
  summary: Summary;
}

// ── 붙여 넣은 코드 읽기 ────────────────────────────────

export interface ParsedTeam {
  members: Member[];
  /** 읽지 못한 줄. text는 그 줄의 앞부분(14자가 넘으면 줄임) */
  errors: { line: number; error: DecodeError; text: string }[];
  /** 앞서 나온 코드와 똑같아서 뺀 줄 */
  duplicates: number[];
}

/** 한 줄에 하나. 결과 링크나 메신저에서 복사한 줄을 붙여 넣어도 코드 부분만 읽는다. */
export function parseTeamCodes(text: string): ParsedTeam {
  const out: ParsedTeam = { members: [], errors: [], duplicates: [] };
  const seen = new Set<string>();
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = i + 1;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const code = extractCode(trimmed);
    if (seen.has(code)) {
      out.duplicates.push(line);
      return;
    }
    const r = decode(code);
    if (!r.ok) {
      out.errors.push({ line, error: r.error, text: trimmed.length > 14 ? `${trimmed.slice(0, 14)}…` : trimmed });
      return;
    }
    seen.add(code);
    out.members.push({ nick: r.nick, summary: r.summary });
  });
  return out;
}

// ── 유형 분포(순위 없음) ───────────────────────────────

export interface MemberType {
  core: Archetype;
  second: Archetype;
}

export function typeDistribution(members: readonly Member[]): {
  types: MemberType[];
  /** 원형별로 주 유형인 사람 수, 보조 유형인 사람 수 */
  core: Record<Archetype, number>;
  second: Record<Archetype, number>;
} {
  const zero = () => Object.fromEntries(ARCHETYPES.map((a) => [a, 0])) as Record<Archetype, number>;
  const core = zero();
  const second = zero();
  const types = members.map((m) => {
    const p = place(m.summary.aSum, bCounts(m.summary.b).best, m.summary.picks);
    // 코드를 읽을 때 정해지지 않은 결과는 걸러지므로 여기서는 늘 정해져 있다
    const t = { core: p.core!, second: p.second! };
    core[t.core]++;
    second[t.second]++;
    return t;
  });
  return { types, core, second };
}

// ── 표시 이름 ──────────────────────────────────────────

/** 별명이 없거나 별명 숨기기를 켜면 '팀원 n' */
export function displayName(m: Member, index: number, hide: boolean): string {
  return !hide && m.nick ? m.nick : `팀원 ${index + 1}`;
}

// ── 원형별 팀원 ────────────────────────────────────────

export interface ArchetypeMembers {
  /** 그 원형이 주 유형인 멤버 순번 */
  core: number[];
  /** 그 원형이 보조 유형인 멤버 순번 */
  second: number[];
}

export function membersByArchetype(members: readonly Member[]): Record<Archetype, ArchetypeMembers> {
  const out = Object.fromEntries(ARCHETYPES.map((a): [Archetype, ArchetypeMembers] => [a, { core: [], second: [] }])) as Record<
    Archetype,
    ArchetypeMembers
  >;
  typeDistribution(members).types.forEach((t, i) => {
    out[t.core].core.push(i);
    out[t.second].second.push(i);
  });
  return out;
}

// ── 다섯 방식의 균형 ───────────────────────────────────

/**
 * 오각형 꼭짓점 순서. Boris Cherny 원글의 번호(1–5)로, 사업이 자라는 순서다.
 * 단계별로 필요한 조합이 이 순서에서 이어진 세 칸이 된다.
 */
export const CYCLE: readonly Archetype[] = ['P', 'B', 'S', 'G', 'M'];

/** 원형별로 그 방식을 주 또는 보조 유형으로 가진 팀원 수 */
export function totals(core: Record<Archetype, number>, second: Record<Archetype, number>): Record<Archetype, number> {
  return Object.fromEntries(ARCHETYPES.map((a) => [a, core[a] + second[a]])) as Record<Archetype, number>;
}

/** 가장 많이·적게 들어 있는 방식. 다섯이 모두 같으면 null */
export function extremes(total: Record<Archetype, number>): { most: Archetype[]; least: Archetype[] } | null {
  const vals = CYCLE.map((a) => total[a]);
  const hi = Math.max(...vals);
  const lo = Math.min(...vals);
  if (hi === lo) return null;
  return { most: CYCLE.filter((a) => total[a] === hi), least: CYCLE.filter((a) => total[a] === lo) };
}

// ── 사업 단계별로 필요한 조합(원글) ────────────────────

export type PhaseId = 'new' | 'growing' | 'mature';
export type Need = 'core' | 'some';

/**
 * 원글: pre-PMF 1+2+3 / growing 2+3+4, 5 약간 / strong PMF 3+4+5, 2 약간.
 * 비율(필요 1, 약간 0.5)은 이 도구가 정했다. 검증된 기준이 아니라 화면에서는 참고용으로만 보여 준다.
 */
export const PHASES: readonly { id: PhaseId; need: Partial<Record<Archetype, Need>> }[] = [
  { id: 'new', need: { P: 'core', B: 'core', S: 'core' } },
  { id: 'growing', need: { B: 'core', S: 'core', G: 'core', M: 'some' } },
  { id: 'mature', need: { S: 'core', G: 'core', M: 'core', B: 'some' } },
];

const WEIGHT: Record<Need, number> = { core: 1, some: 0.5 };

export function phaseOf(id: PhaseId): (typeof PHASES)[number] {
  return PHASES.find((p) => p.id === id)!;
}

/**
 * 비교용 모양. 팀의 주·보조 자리(사람마다 2개, 모두 2n개)를
 * 단계가 없으면 다섯 방식에 똑같이, 있으면 그 단계에 필요한 조합 비율대로 나눈다.
 */
export function referenceShape(n: number, phase: PhaseId | null): Record<Archetype, number> {
  const w = Object.fromEntries(
    ARCHETYPES.map((a) => {
      const need = phase ? phaseOf(phase).need[a] : 'core';
      return [a, need ? WEIGHT[need] : 0];
    }),
  ) as Record<Archetype, number>;
  const sum = ARCHETYPES.reduce((acc, a) => acc + w[a], 0);
  return Object.fromEntries(ARCHETYPES.map((a) => [a, (2 * n * w[a]) / sum])) as Record<Archetype, number>;
}

export interface PhaseGaps {
  /** 이 단계에 필요한 방식 */
  need: Archetype[];
  /** 약간 필요한 방식 */
  some: Archetype[];
  /** 필요한 방식 가운데 가장 적은 것. 모두 같으면 빈 배열 */
  fewest: Archetype[];
  /** 이 단계 조합 밖인데 팀에 있는 방식 */
  outside: Archetype[];
}

export function phaseGaps(total: Record<Archetype, number>, phase: PhaseId): PhaseGaps {
  const need = phaseOf(phase).need;
  const core = CYCLE.filter((a) => need[a] === 'core');
  const some = CYCLE.filter((a) => need[a] === 'some');
  const vals = core.map((a) => total[a]);
  const lo = Math.min(...vals);
  const fewest = lo === Math.max(...vals) ? [] : core.filter((a) => total[a] === lo);
  const outside = CYCLE.filter((a) => !need[a] && total[a] > 0);
  return { need: core, some, fewest, outside };
}
