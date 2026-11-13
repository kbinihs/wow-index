import { decode, extractCode, type DecodeError } from './codec';
import { bCounts, place } from './scoring';
import { ARCHETYPES, type Archetype, type Summary } from './types';

export interface Member {
  nick: string | null;
  /** 결과를 공유할 때 붙은 팀 이름(팀 링크로 들어왔거나 직접 적은 것) */
  team: string | null;
  summary: Summary;
}

// ── 붙여 넣은 코드 읽기 ────────────────────────────────

/** 읽을 글 하나. label은 파일 이름(붙여 넣은 글은 null) */
export interface TeamSource {
  label: string | null;
  text: string;
}

/** 어느 글의 몇 번째 줄인지 */
export interface LineRef {
  source: string | null;
  line: number;
}

export interface ParsedTeam {
  members: Member[];
  /** 코드처럼 보이지만 읽지 못한 줄. text는 그 줄의 앞부분(14자가 넘으면 줄임) */
  errors: (LineRef & { error: DecodeError; text: string })[];
  /** 앞서 나온 코드와 똑같아서 뺀 줄 */
  duplicates: LineRef[];
  /** 같은 팀·같은 별명으로 코드가 여러 개 온 사람. 마지막 것(used)만 쓴다 */
  replaced: { nick: string; team: string | null; count: number; used: LineRef }[];
  /** 코드가 없어 건너뛴 줄(대화방의 인사말·이름·시각 등) 수 */
  skipped: number;
}

/**
 * 코드처럼 보이는 줄: 결과 링크가 있거나, 코드 머리('{"v'의 base64인 eyJ)가 있거나,
 * 줄 전체가 코드 글자로만 된 긴 덩어리. 나머지(대화 내용)는 오류로 알리지 않고 건너뛴다.
 */
export function looksLikeCode(line: string): boolean {
  return /#\/result\//.test(line) || /eyJ[A-Za-z0-9_-]{4,}/.test(line) || /^[A-Za-z0-9_-]{12,}$/.test(line.trim());
}

/**
 * 붙여 넣은 글과 올린 파일들을 차례로 읽는다. 한 줄에 코드 하나.
 * 결과 링크, 메신저에서 복사한 줄, 카카오톡 '대화 내보내기' 파일의 줄에서도 코드 부분만 읽는다.
 */
export function parseTeamSources(sources: readonly TeamSource[]): ParsedTeam {
  const out: ParsedTeam = { members: [], errors: [], duplicates: [], replaced: [], skipped: 0 };
  const seen = new Set<string>();
  /** 팀·별명 → members 안의 자리 */
  const byNick = new Map<string, number>();
  const counts = new Map<string, { nick: string; team: string | null; count: number; used: LineRef }>();
  for (const { label, text } of sources) {
    text.split(/\r?\n/).forEach((raw, i) => {
      const ref: LineRef = { source: label, line: i + 1 };
      const trimmed = raw.trim();
      if (!trimmed) return;
      if (!looksLikeCode(trimmed)) {
        out.skipped++;
        return;
      }
      const code = extractCode(trimmed);
      if (seen.has(code)) {
        out.duplicates.push(ref);
        return;
      }
      const r = decode(code);
      if (!r.ok) {
        out.errors.push({ ...ref, error: r.error, text: trimmed.length > 14 ? `${trimmed.slice(0, 14)}…` : trimmed });
        return;
      }
      seen.add(code);
      const member: Member = { nick: r.nick, team: r.team, summary: r.summary };
      if (!r.nick) {
        out.members.push(member);
        return;
      }
      // 같은 사람이 다시 하고 또 보냈으면 나중 것을 쓴다(자리는 처음 자리 그대로)
      const key = `${r.team ?? ''}\u0000${r.nick}`;
      const at = byNick.get(key);
      if (at === undefined) {
        byNick.set(key, out.members.length);
        out.members.push(member);
        counts.set(key, { nick: r.nick, team: r.team, count: 1, used: ref });
      } else {
        out.members[at] = member;
        const c = counts.get(key)!;
        c.count++;
        c.used = ref;
      }
    });
  }
  out.replaced = [...counts.values()].filter((c) => c.count > 1);
  return out;
}

/** 붙여 넣은 글 하나만 읽을 때 */
export const parseTeamCodes = (text: string): ParsedTeam => parseTeamSources([{ label: null, text }]);

// ── 팀별로 나눠 보기 ───────────────────────────────────

/** 팀 고르기의 열쇠. 팀 이름, 팀 표시가 없는 코드, 모두 */
export type TeamKey = { kind: 'team'; team: string } | { kind: 'none' } | { kind: 'all' };

export interface TeamGroup {
  key: TeamKey;
  count: number;
}

/** 불러온 코드에 들어 있는 팀(사람 많은 순, 같으면 이름순). 팀 표시가 없는 코드는 맨 뒤 */
export function teamGroups(members: readonly Member[]): TeamGroup[] {
  const by = new Map<string, number>();
  let none = 0;
  for (const m of members) {
    if (m.team) by.set(m.team, (by.get(m.team) ?? 0) + 1);
    else none++;
  }
  const groups: TeamGroup[] = [...by.entries()]
    .sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], 'ko'))
    .map(([team, count]) => ({ key: { kind: 'team', team }, count }));
  if (none) groups.push({ key: { kind: 'none' }, count: none });
  return groups;
}

export const sameKey = (a: TeamKey, b: TeamKey): boolean =>
  a.kind === b.kind && (a.kind !== 'team' || (b.kind === 'team' && a.team === b.team));

export function filterByTeam(members: readonly Member[], key: TeamKey): Member[] {
  if (key.kind === 'all') return [...members];
  if (key.kind === 'none') return members.filter((m) => !m.team);
  return members.filter((m) => m.team === key.team);
}

/**
 * 처음 보여 줄 팀. 팀이 하나뿐이면 모두. 여럿이면 원하는 팀(팀 링크를 만든 이름이나 이 브라우저가 들어온 팀)이
 * 있으면 그 팀, 없으면 모두.
 */
export function defaultTeamKey(groups: readonly TeamGroup[], preferred: readonly (string | null)[]): TeamKey {
  if (groups.length <= 1) return { kind: 'all' };
  for (const p of preferred) {
    if (p && groups.some((g) => g.key.kind === 'team' && g.key.team === p)) return { kind: 'team', team: p };
  }
  return { kind: 'all' };
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
    const p = place(m.summary.aSum, bCounts(m.summary.b), m.summary.picks);
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
