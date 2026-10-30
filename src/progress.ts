import { ITEMS } from './data/items';
import { SCENARIOS } from './data/scenarios';
import { aSumsFromResponses, bCounts, neededPicks, place, type Placement } from './scoring';
import { mulberry32, shuffle, shuffleNoRun3 } from './shuffle';
import { loadItem, removeItem, saveItem } from './storage';
import { ARCHETYPES, type Archetype, type Picks, type Summary } from './types';

export type PartKey = 'A' | 'B' | 'pick';

export type Step = { part: 'A'; page: number } | { part: 'B'; index: number };

export const A_PER_PAGE = 4;
const A_PAGES = ITEMS.length / A_PER_PAGE;

/** 진행 순서: A → B. 동점이면 그 뒤에 고르기 화면이 붙는다. */
export const STEPS: readonly Step[] = [
  ...Array.from({ length: A_PAGES }, (_, page) => ({ part: 'A' as const, page })),
  ...SCENARIOS.map((_, index) => ({ part: 'B' as const, index })),
];

export type RoleChoice = { best: Archetype | null; worst: Archetype | null };

export interface Progress {
  v: 3;
  seed: number;
  /** A 표시 순서(문항 ID) */
  aOrder: string[];
  /** B 상황별 선택지 표시 순서 */
  bOrder: Archetype[][];
  /** STEPS의 위치. STEPS.length이면 고르기 화면 */
  step: number;
  a: Record<string, number>;
  b: RoleChoice[];
  picks: Picks;
  /** 파트별 머문 시간(ms) */
  ms: Record<PartKey, number>;
  startedAt: string;
  finishedAt: string | null;
}

const KEY = 'wa:progress:v3';

function randomSeed(): number {
  try {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  } catch {
    return Math.floor(Math.random() * 2 ** 32);
  }
}

export function newProgress(seed = randomSeed()): Progress {
  const rng = mulberry32(seed);
  return {
    v: 3,
    seed,
    aOrder: shuffleNoRun3(ITEMS, (i) => i.archetype, rng).map((i) => i.id),
    bOrder: SCENARIOS.map(() => shuffle(ARCHETYPES, rng)),
    step: 0,
    a: {},
    b: SCENARIOS.map(() => ({ best: null, worst: null })),
    picks: {},
    ms: { A: 0, B: 0, pick: 0 },
    startedAt: new Date().toISOString(),
    finishedAt: null,
  };
}

export function itemsOnPage(p: Progress, page: number): string[] {
  return p.aOrder.slice(page * A_PER_PAGE, (page + 1) * A_PER_PAGE);
}

export function isStepComplete(p: Progress, step: Step): boolean {
  if (step.part === 'A') return itemsOnPage(p, step.page).every((id) => p.a[id] !== undefined);
  const c = p.b[step.index];
  return c.best !== null && c.worst !== null;
}

/**
 * Part B 탭 규칙. 첫 탭 → 가장 맡고 싶음, 다른 항목 탭 → 가장 맡고 싶지 않음.
 * 고른 항목을 다시 탭하면 해제. 둘 다 고른 뒤 세 번째 항목을 탭하면 '가장 맡고 싶지 않음'을 그 항목으로 바꾼다.
 */
export function tapRole(c: RoleChoice, a: Archetype): RoleChoice {
  if (c.best === a) return { ...c, best: null };
  if (c.worst === a) return { ...c, worst: null };
  if (c.best === null) return { ...c, best: a };
  return { ...c, worst: a };
}

/** A·B를 모두 답했으면 지금 선택으로 정해진 자리, 아니면 null */
export function placementOf(p: Progress): Placement | null {
  if (!STEPS.every((s) => isStepComplete(p, s))) return null;
  const aSum = aSumsFromResponses(p.a);
  const b = p.b.map((c) => ({ best: c.best!, worst: c.worst! }));
  return place(aSum, bCounts(b).best, p.picks);
}

/** 모두 답하고 동점도 정했으면 결과 요약, 아니면 null */
export function summaryOf(p: Progress): Summary | null {
  const placement = placementOf(p);
  if (!placement || placement.pending) return null;
  const aSum = aSumsFromResponses(p.a);
  const b = p.b.map((c) => ({ best: c.best!, worst: c.worst! }));
  return { aSum, b, picks: neededPicks(aSum, bCounts(b).best, p.picks) };
}

export function hasAnswers(p: Progress): boolean {
  return Object.keys(p.a).length > 0 || p.step > 0;
}

// ── 저장 ───────────────────────────────────────────────

function looksValid(p: unknown): p is Progress {
  if (typeof p !== 'object' || p === null) return false;
  const q = p as Progress;
  return (
    q.v === 3 &&
    Array.isArray(q.aOrder) &&
    q.aOrder.length === ITEMS.length &&
    Array.isArray(q.bOrder) &&
    q.bOrder.length === SCENARIOS.length &&
    Array.isArray(q.b) &&
    q.b.length === SCENARIOS.length &&
    Number.isInteger(q.step) &&
    q.step >= 0 &&
    q.step <= STEPS.length &&
    typeof q.picks === 'object' &&
    typeof q.ms === 'object'
  );
}

export function loadProgress(): Progress | null {
  const raw = loadItem(KEY);
  if (!raw) return null;
  try {
    const p: unknown = JSON.parse(raw);
    return looksValid(p) ? p : null;
  } catch {
    return null;
  }
}

export function saveProgress(p: Progress): void {
  saveItem(KEY, JSON.stringify(p));
}

export function clearProgress(): void {
  removeItem(KEY);
}
