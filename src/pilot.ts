import { ITEMS } from './data/items';
import { SCENARIOS } from './data/scenarios';
import { placementOf, type Progress } from './progress';
import { ARCHETYPES, type Archetype, type Picks } from './types';

/**
 * 파일럿 응답 파일. 문항 분석용 원본이라 결과 링크·팀 코드와 섞지 않는다.
 * 이름·연락처는 담지 않는다. label은 진행자가 알려 준 참여 번호(선택).
 */
export interface PilotRecord {
  kind: 'wow-index-pilot';
  /** v2: 원글 정의에 맞춰 문항을 고친 뒤. v1 파일과 섞어 분석하지 않는다. */
  v: 2;
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
    v: 2,
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

function isRecord(x: unknown): x is PilotRecord {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as PilotRecord;
  return (
    r.kind === 'wow-index-pilot' &&
    r.v === 2 &&
    typeof r.a === 'object' &&
    ITEMS.every((i) => Number.isInteger(r.a[i.id]) && r.a[i.id] >= 1 && r.a[i.id] <= 5) &&
    Array.isArray(r.b) &&
    r.b.length === SCENARIOS.length &&
    r.b.every((c) => isArchetype(c.best) && isArchetype(c.worst) && c.best !== c.worst) &&
    typeof r.result === 'object' &&
    isArchetype(r.result.core) &&
    isArchetype(r.result.second) &&
    typeof r.seconds === 'object'
  );
}

/** 파일 하나 또는 붙여 넣은 글. 객체 하나, 배열, 객체 여러 개를 이어 붙인 것 모두 받는다. */
export function parsePilotText(text: string): { records: PilotRecord[]; bad: number } {
  const t = text.trim();
  if (!t) return { records: [], bad: 0 };
  let parsed: unknown;
  try {
    parsed = JSON.parse(t);
  } catch {
    try {
      parsed = JSON.parse(`[${t.replace(/}\s*{/g, '},{')}]`);
    } catch {
      return { records: [], bad: 1 };
    }
  }
  const list = Array.isArray(parsed) ? parsed : [parsed];
  const records = list.filter(isRecord);
  return { records, bad: list.length - records.length };
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
}

export interface ArchetypeStat {
  archetype: Archetype;
  alpha: number | null;
  items: ItemStat[];
}

export function itemAnalysis(records: readonly PilotRecord[]): ArchetypeStat[] {
  return ARCHETYPES.map((archetype) => {
    const ids = ITEMS.filter((i) => i.archetype === archetype).map((i) => i.id);
    const rows = records.map((r) => ids.map((id) => r.a[id]));
    const items = ids.map((id, j) => {
      const xs = rows.map((row) => row[j]);
      const rest = rows.map((row) => row.reduce((a, b, k) => (k === j ? a : a + b), 0));
      return { id, mean: xs.length ? mean(xs) : 0, sd: sd(xs), rest: pearson(xs, rest) };
    });
    return { archetype, alpha: cronbachAlpha(rows), items };
  });
}

export function coreCounts(records: readonly PilotRecord[]): Record<Archetype, number> {
  const out = Object.fromEntries(ARCHETYPES.map((a) => [a, 0])) as Record<Archetype, number>;
  for (const r of records) out[r.result.core]++;
  return out;
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
  const s = v === null || v === undefined ? '' : String(v);
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
