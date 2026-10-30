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

// ── 7.2 팀 업무 단계 ───────────────────────────────────

export type StageId = 'try' | 'build' | 'grow' | 'keep' | 'close';

/** 설계서 7.2: 업무 단계와 연결되는 원형 */
export const STAGES: readonly { id: StageId; label: string; archetype: Archetype }[] = [
  { id: 'try', label: '시도', archetype: 'P' },
  { id: 'build', label: '구축', archetype: 'B' },
  { id: 'grow', label: '개선·확장', archetype: 'G' },
  { id: 'keep', label: '유지', archetype: 'M' },
  { id: 'close', label: '정리·종료', archetype: 'S' },
];

export const MAX_TASKS = 7;

export interface TeamTask {
  name: string;
  stage: StageId | null;
  /** 이번 분기 담당·필요한 지원(진행자가 대화하며 채움, 계산하지 않음) */
  note: string;
}

export interface StageCoverage {
  stage: (typeof STAGES)[number];
  /** 이 단계로 적은 업무 이름 */
  tasks: string[];
  core: number[];
  second: number[];
}

/** 업무가 하나라도 있는 단계만, 그 단계의 원형을 주·보조 유형으로 가진 팀원과 함께 */
export function stageCoverage(tasks: readonly TeamTask[], members: readonly Member[]): StageCoverage[] {
  const by = membersByArchetype(members);
  return STAGES.flatMap((stage) => {
    const names = tasks.filter((t) => t.stage === stage.id).map((t) => t.name.trim() || '이름 없는 업무');
    if (!names.length) return [];
    return [{ stage, tasks: names, core: by[stage.archetype].core, second: by[stage.archetype].second }];
  });
}
