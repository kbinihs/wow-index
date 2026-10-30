import { ITEMS } from './data/items';
import { ARCHETYPES, type Archetype, type BChoice, type Picks, type Summary } from './types';

/** 평균 간격이 이 값보다 작으면 '차이가 크지 않다'고 본다. 이 값은 한 문항 두 칸, 또는 두 문항 한 칸씩. */
export const DELTA = 0.5;
export const ITEMS_PER_ARCHETYPE = 4;
/** 계산은 원형별 4문항 합계로 해서 부동소수 오차를 피한다. */
const DELTA_SUM = DELTA * ITEMS_PER_ARCHETYPE;
export const SCENARIO_COUNT = 6;

function byArchetype<T>(f: (a: Archetype) => T): Record<Archetype, T> {
  return Object.fromEntries(ARCHETYPES.map((a) => [a, f(a)])) as Record<Archetype, T>;
}

const isArchetype = (x: unknown): x is Archetype => (ARCHETYPES as readonly unknown[]).includes(x);

// ── 입력 검증 ───────────────────────────────────────────

/** 응답 요약이 올바르면 null, 아니면 이유 */
export function validateSummary(s: Summary): string | null {
  for (const a of ARCHETYPES) {
    const v = s.aSum[a];
    if (!Number.isInteger(v) || v < ITEMS_PER_ARCHETYPE || v > ITEMS_PER_ARCHETYPE * 5) return `A ${a} 범위`;
  }
  if (s.b.length !== SCENARIO_COUNT) return 'B 상황 수';
  for (const c of s.b) {
    if (!isArchetype(c.best) || !isArchetype(c.worst) || c.best === c.worst) return 'B 선택';
  }
  if (s.picks.core !== undefined && !isArchetype(s.picks.core)) return '고른 주 유형';
  if (s.picks.second !== undefined && !isArchetype(s.picks.second)) return '고른 보조 유형';
  return null;
}

// ── Part A ─────────────────────────────────────────────

/** 문항 ID별 응답(1–5) → 원형별 합계(4–20) */
export function aSumsFromResponses(responses: Record<string, number>): Record<Archetype, number> {
  const sums = byArchetype(() => 0);
  for (const item of ITEMS) {
    const v = responses[item.id];
    if (!Number.isInteger(v) || v < 1 || v > 5) throw new RangeError(`${item.id} 응답이 없거나 범위를 벗어남`);
    sums[item.archetype] += v;
  }
  return sums;
}

// ── Part B ─────────────────────────────────────────────

export function bCounts(b: readonly BChoice[]) {
  const best = byArchetype(() => 0);
  const worst = byArchetype(() => 0);
  for (const c of b) {
    best[c.best]++;
    worst[c.worst]++;
  }
  return { best, worst };
}

// ── 자리 정하기 ────────────────────────────────────────

/**
 * 순위 묶음: A 합계가 높은 순. A 합계가 똑같을 때만 B '가장 맡고 싶음' 횟수가 많은 순.
 * 둘 다 같은 원형은 한 묶음(묶음 안은 P·B·S·G·M 순).
 */
export function rankGroups(aSum: Record<Archetype, number>, best: Record<Archetype, number>): Archetype[][] {
  const sorted = [...ARCHETYPES].sort((x, y) => aSum[y] - aSum[x] || best[y] - best[x]);
  const groups: Archetype[][] = [];
  for (const a of sorted) {
    const last = groups[groups.length - 1];
    if (last && aSum[last[0]] === aSum[a] && best[last[0]] === best[a]) last.push(a);
    else groups.push([a]);
  }
  return groups;
}

export type Slot = 'core' | 'second';

export interface Placement {
  /** 1위: 주 유형 */
  core: Archetype | null;
  /** 2위: 보조 유형 */
  second: Archetype | null;
  /** 3위: 성장 방향(동점이면 여럿) */
  growth: Archetype[];
  /** 그 아래: 채워 줄 짝 */
  partners: Archetype[];
  /** 본인이 골라야 하는 자리가 있으면 그 자리와 후보 */
  pending: { slot: Slot; candidates: Archetype[] } | null;
}

/** 1위 주 유형, 2위 보조 유형, 3위 성장 방향, 나머지 채워 줄 짝 */
export function place(aSum: Record<Archetype, number>, best: Record<Archetype, number>, picks: Picks): Placement {
  const out: Placement = { core: null, second: null, growth: [], partners: [], pending: null };
  let rest = rankGroups(aSum, best);

  const take = (slot: Slot): Archetype | null => {
    const top = rest[0];
    let chosen: Archetype | undefined;
    if (top.length === 1) chosen = top[0];
    else if (picks[slot] && top.includes(picks[slot]!)) chosen = picks[slot];
    if (!chosen) {
      out.pending = { slot, candidates: [...top] };
      return null;
    }
    rest = rest.map((g) => g.filter((a) => a !== chosen)).filter((g) => g.length);
    return chosen;
  };

  out.core = take('core');
  if (!out.core) return out;
  out.second = take('second');
  if (!out.second) return out;
  out.growth = rest[0];
  out.partners = rest.slice(1).flat();
  return out;
}

/** 실제로 동점이라 골라야 했던 자리의 선택만 남긴다(답을 바꿔 동점이 풀렸으면 버림) */
export function neededPicks(aSum: Record<Archetype, number>, best: Record<Archetype, number>, picks: Picks): Picks {
  const out: Picks = {};
  const first = place(aSum, best, {});
  if (first.pending?.slot === 'core') {
    if (!picks.core || !first.pending.candidates.includes(picks.core)) return out;
    out.core = picks.core;
  }
  const second = place(aSum, best, out);
  if (second.pending?.slot === 'second' && picks.second && second.pending.candidates.includes(picks.second)) {
    out.second = picks.second;
  }
  return out;
}

// ── 전체 ───────────────────────────────────────────────

export interface Result {
  aSum: Record<Archetype, number>;
  /** 원형별 평균(1–5) */
  means: Record<Archetype, number>;
  placement: Placement;
  /** 주·보조 평균 차이가 δ 미만 */
  closePair: boolean;
  /** 다섯 평균의 최고·최저 차이가 δ 미만 */
  flat: boolean;
}

export function score(s: Summary): Result {
  const invalid = validateSummary(s);
  if (invalid) throw new RangeError(`응답 요약이 올바르지 않음: ${invalid}`);

  const placement = place(s.aSum, bCounts(s.b).best, s.picks);
  const sums = ARCHETYPES.map((a) => s.aSum[a]);
  const { core, second } = placement;

  return {
    aSum: { ...s.aSum },
    means: byArchetype((a) => s.aSum[a] / ITEMS_PER_ARCHETYPE),
    placement,
    closePair: core !== null && second !== null && s.aSum[core] - s.aSum[second] < DELTA_SUM,
    flat: Math.max(...sums) - Math.min(...sums) < DELTA_SUM,
  };
}
