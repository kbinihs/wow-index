import { decode, type DecodeError } from './codec';
import { bCounts, place, SCENARIO_COUNT } from './scoring';
import { ARCHETYPES, type Archetype, type Summary } from './types';

export interface Member {
  nick: string | null;
  summary: Summary;
}

// ── 붙여 넣은 코드 읽기 ────────────────────────────────

export interface ParsedTeam {
  members: Member[];
  errors: { line: number; error: DecodeError }[];
  /** 앞서 나온 코드와 똑같아서 뺀 줄 */
  duplicates: number[];
}

/** 한 줄에 하나. 결과 링크 전체를 붙여 넣어도 코드 부분만 읽는다. */
export function parseTeamCodes(text: string): ParsedTeam {
  const out: ParsedTeam = { members: [], errors: [], duplicates: [] };
  const seen = new Set<string>();
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = i + 1;
    let code = raw.trim();
    if (!code) return;
    const m = code.match(/#\/result\/([^\s?#]+)/);
    if (m) code = m[1];
    if (seen.has(code)) {
      out.duplicates.push(line);
      return;
    }
    const r = decode(code);
    if (!r.ok) {
      out.errors.push({ line, error: r.error });
      return;
    }
    seen.add(code);
    out.members.push({ nick: r.nick, summary: r.summary });
  });
  return out;
}

// ── 7.3.5 상황별 선택 분포 ─────────────────────────────

export interface ScenarioPicks {
  /** 원형별로 그 역할을 고른 멤버 순번 */
  best: Record<Archetype, number[]>;
  worst: Record<Archetype, number[]>;
}

export function scenarioDistribution(members: readonly Member[]): ScenarioPicks[] {
  const empty = () => Object.fromEntries(ARCHETYPES.map((a) => [a, [] as number[]])) as Record<Archetype, number[]>;
  return Array.from({ length: SCENARIO_COUNT }, (_, si) => {
    const picks: ScenarioPicks = { best: empty(), worst: empty() };
    members.forEach((m, mi) => {
      const c = m.summary.b[si];
      picks.best[c.best].push(mi);
      picks.worst[c.worst].push(mi);
    });
    return picks;
  });
}

// ── 7.3.6 유형 분포(순위 없음) ─────────────────────────

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

/** 별명이 없거나 이름 숨기기를 켜면 '팀원 n' */
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

/** 오각형 꼭짓점 순서: 일의 흐름(시도 → 구축 → 개선·확장 → 유지 → 정리·종료) */
export const CYCLE: readonly Archetype[] = ['P', 'B', 'G', 'M', 'S'];

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
