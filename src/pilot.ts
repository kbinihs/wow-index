import { ITEMS } from './data/items';
import { SCENARIOS } from './data/scenarios';
import { placementOf, type Progress } from './progress';
import { ARCHETYPES, type Archetype, type Picks } from './types';

/**
 * 파일럿 응답 파일. 문항 분석용 원본이라 결과 링크·팀 코드와 섞지 않는다.
 * 이름·연락처는 담지 않는다. label은 진행자가 알려 준 참여 번호(선택).
 */
/** v3: 응답 척도(끌림 → 맡고 싶음)와 문항·상황 문구를 고친 뒤. v2 이하 파일과 섞어 분석하지 않는다. */
export const PILOT_VERSION = 3;

export interface PilotRecord {
  kind: 'wow-index-pilot';
  v: typeof PILOT_VERSION;
  label: string | null;
  exportedAt: string;
  startedAt: string;
  finishedAt: string | null;
  /** 파트별 머문 시간(초) */
  seconds: { A: number; B: number; pick: number };
  /** A 문항 ID별 응답(1–5) */
  a: Record<string, number>;
  /** A 문항이 화면에 나온 순서 */
  aOrder: string[];
  /** B 상황별 선택과 선택지가 나온 순서 */
  b: { id: string; best: Archetype; worst: Archetype; order: Archetype[] }[];
  picks: Picks;
  result: { core: Archetype; second: Archetype };
}

export const LABEL_MAX = 20;

export function buildPilotRecord(p: Progress, label: string | null, now = new Date()): PilotRecord | null {
  const placement = placementOf(p);
  if (!p.finishedAt || !placement || placement.pending || !placement.core || !placement.second) return null;
  const sec = (ms: number) => Math.round(ms / 1000);
  const trimmed = (label ?? '').trim().slice(0, LABEL_MAX);
  return {
    kind: 'wow-index-pilot',
    v: PILOT_VERSION,
    label: trimmed || null,
    exportedAt: now.toISOString(),
    startedAt: p.startedAt,
    finishedAt: p.finishedAt,
    seconds: { A: sec(p.ms.A), B: sec(p.ms.B), pick: sec(p.ms.pick) },
    a: { ...p.a },
    aOrder: [...p.aOrder],
    b: SCENARIOS.map((sc, i) => ({ id: sc.id, best: p.b[i].best!, worst: p.b[i].worst!, order: [...p.bOrder[i]] })),
    picks: { ...p.picks },
    result: { core: placement.core, second: placement.second },
  };
}

export function pilotFileName(r: PilotRecord): string {
  const stamp = r.exportedAt.slice(0, 16).replace(/[-:T]/g, '');
  const label = r.label ? `-${r.label.replace(/[^\p{L}\p{N}_-]+/gu, '_')}` : '';
  return `wow-index-pilot-${stamp}${label}.json`;
}

// ── 읽기 ───────────────────────────────────────────────

const isArchetype = (x: unknown): x is Archetype => (ARCHETYPES as readonly unknown[]).includes(x);

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** 손으로 고쳤거나 깨진 파일이 분석 화면을 멈추지 않도록, 화면과 CSV가 쓰는 칸을 모두 확인한다 */
function isRecord(x: unknown): x is PilotRecord {
  try {
    if (!isObject(x)) return false;
    const r = x as unknown as PilotRecord;
    return (
      r.kind === 'wow-index-pilot' &&
      r.v === PILOT_VERSION &&
      (r.label === null || typeof r.label === 'string') &&
      typeof r.exportedAt === 'string' &&
      typeof r.startedAt === 'string' &&
      isObject(r.a) &&
      ITEMS.every((i) => Number.isInteger(r.a[i.id]) && r.a[i.id] >= 1 && r.a[i.id] <= 5) &&
      Array.isArray(r.aOrder) &&
      r.aOrder.length === ITEMS.length &&
      r.aOrder.every((id) => typeof id === 'string') &&
      Array.isArray(r.b) &&
      r.b.length === SCENARIOS.length &&
      r.b.every((c) => isObject(c) && isArchetype(c.best) && isArchetype(c.worst) && c.best !== c.worst) &&
      isObject(r.result) &&
      isArchetype(r.result.core) &&
      isArchetype(r.result.second) &&
      isObject(r.seconds) &&
      (['A', 'B', 'pick'] as const).every((k) => Number.isFinite(r.seconds[k]))
    );
  } catch {
    return false;
  }
}

/** 문항이 바뀌기 전 버전의 파일(따로 세어 알린다) */
const isOldRecord = (x: unknown) => isObject(x) && x.kind === 'wow-index-pilot' && typeof x.v === 'number' && x.v < PILOT_VERSION;

/** 같은 응답인지 가리는 열쇠. 같은 응답을 여러 번 내보낸 파일은 시작 시각과 문항 순서가 같다. */
export const recordKey = (r: PilotRecord) => `${r.startedAt}|${r.aOrder.join(',')}`;

/** 파일 하나 또는 붙여 넣은 글. 객체 하나, 배열, 객체 여러 개를 이어 붙인 것 모두 받는다. */
export function parsePilotText(text: string): { records: PilotRecord[]; bad: number; old: number } {
  const t = text.trim();
  if (!t) return { records: [], bad: 0, old: 0 };
  let parsed: unknown;
  try {
    parsed = JSON.parse(t);
  } catch {
    try {
      parsed = JSON.parse(`[${t.replace(/}\s*{/g, '},{')}]`);
    } catch {
      return { records: [], bad: 1, old: 0 };
    }
  }
  const list = Array.isArray(parsed) ? parsed : [parsed];
  const records = list.filter(isRecord);
  const old = list.filter(isOldRecord).length;
  return { records, bad: list.length - records.length - old, old };
}

// ── 통계 ───────────────────────────────────────────────

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

/** 표본 분산(n−1) */
function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1);
}

export function sd(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

/** 피어슨 상관. 한쪽이라도 값이 모두 같으면 계산할 수 없어 null */
export function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 3) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  xs.forEach((x, i) => {
    sxy += (x - mx) * (ys[i] - my);
    sxx += (x - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  });
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

/** 크론바흐 알파. rows[참여자][문항] */
export function cronbachAlpha(rows: number[][]): number | null {
  if (rows.length < 3) return null;
  const k = rows[0].length;
  const itemVar = Array.from({ length: k }, (_, j) => variance(rows.map((r) => r[j])));
  const totalVar = variance(rows.map((r) => r.reduce((a, b) => a + b, 0)));
  if (totalVar === 0) return null;
  return (k / (k - 1)) * (1 - itemVar.reduce((a, b) => a + b, 0) / totalVar);
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface ItemStat {
  id: string;
  mean: number;
  sd: number;
  /** 같은 원형의 나머지 세 문항 합과의 상관(수정된 문항-총점 상관) */
  rest: number | null;
  /** 다른 원형의 네 문항 합과의 상관 가운데 가장 큰 것. 이웃 원형과 겹치는 문항을 찾는 데 쓴다. */
  cross: { archetype: Archetype; r: number } | null;
}

export interface ArchetypeStat {
  archetype: Archetype;
  alpha: number | null;
  items: ItemStat[];
}

const archetypeSum = (r: PilotRecord, a: Archetype) => ITEMS.reduce((s, i) => (i.archetype === a ? s + r.a[i.id] : s), 0);

export function itemAnalysis(records: readonly PilotRecord[]): ArchetypeStat[] {
  return ARCHETYPES.map((archetype) => {
    const ids = ITEMS.filter((i) => i.archetype === archetype).map((i) => i.id);
    const rows = records.map((r) => ids.map((id) => r.a[id]));
    const items = ids.map((id, j) => {
      const xs = rows.map((row) => row[j]);
      const rest = rows.map((row) => row.reduce((a, b, k) => (k === j ? a : a + b), 0));
      let cross: ItemStat['cross'] = null;
      for (const other of ARCHETYPES) {
        if (other === archetype) continue;
        const r = pearson(xs, records.map((rec) => archetypeSum(rec, other)));
        if (r !== null && (cross === null || r > cross.r)) cross = { archetype: other, r };
      }
      return { id, mean: xs.length ? mean(xs) : 0, sd: sd(xs), rest: pearson(xs, rest), cross };
    });
    return { archetype, alpha: cronbachAlpha(rows), items };
  });
}

export function coreCounts(records: readonly PilotRecord[]): Record<Archetype, number> {
  const out = Object.fromEntries(ARCHETYPES.map((a) => [a, 0])) as Record<Archetype, number>;
  for (const r of records) out[r.result.core]++;
  return out;
}

/**
 * 업무 선호(A)로 정한 주 유형이 상황 선택(B)에서 '가장 맡고 싶음'으로 가장 많이 고른 방식과 같은 참여자 수.
 * 가장 많이 고른 방식이 여럿이면 그중 하나와 같아도 같다고 센다.
 */
export function abAgreement(records: readonly PilotRecord[]): { match: number; n: number } {
  let match = 0;
  for (const r of records) {
    const best = Object.fromEntries(ARCHETYPES.map((a) => [a, 0])) as Record<Archetype, number>;
    for (const c of r.b) best[c.best]++;
    if (best[r.result.core] === Math.max(...ARCHETYPES.map((a) => best[a]))) match++;
  }
  return { match, n: records.length };
}

/** 상황마다 원형별로 '가장 맡고 싶음'·'가장 맡고 싶지 않음'을 고른 사람 수 */
export function scenarioCounts(records: readonly PilotRecord[]) {
  return SCENARIOS.map((sc, i) => {
    const best = Object.fromEntries(ARCHETYPES.map((a) => [a, 0])) as Record<Archetype, number>;
    const worst = { ...best };
    for (const r of records) {
      best[r.b[i].best]++;
      worst[r.b[i].worst]++;
    }
    return { id: sc.id, best, worst };
  });
}

// ── CSV ────────────────────────────────────────────────

function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  // 참여자가 적은 참여 번호가 =, +, -, @로 시작하면 엑셀이 수식으로 읽지 않게 막는다
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** 참여자 한 명이 한 줄. 엑셀에서 한글이 깨지지 않도록 BOM을 붙인다. */
export function toCsv(records: readonly PilotRecord[]): string {
  const ids = ITEMS.map((i) => i.id);
  const header = [
    'label',
    'exported_at',
    'core',
    'second',
    ...ids,
    ...SCENARIOS.flatMap((sc) => [`${sc.id}_best`, `${sc.id}_worst`]),
    'seconds_A',
    'seconds_B',
    'seconds_pick',
    'a_order',
  ];
  const rows = records.map((r) => [
    r.label,
    r.exportedAt,
    r.result.core,
    r.result.second,
    ...ids.map((id) => r.a[id]),
    ...r.b.flatMap((c) => [c.best, c.worst]),
    r.seconds.A,
    r.seconds.B,
    r.seconds.pick,
    r.aOrder.join(' '),
  ]);
  return '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}
