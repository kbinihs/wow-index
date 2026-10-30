import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data/items';
import {
  buildPilotRecord,
  coreCounts,
  cronbachAlpha,
  itemAnalysis,
  median,
  parsePilotText,
  pearson,
  pilotFileName,
  scenarioCounts,
  toCsv,
  type PilotRecord,
} from '../src/pilot';
import { newProgress, type Progress } from '../src/progress';
import { EX1, EX1_RESPONSES } from './fixtures';

const finished = (over: Partial<Progress> = {}): Progress => ({
  ...newProgress(7),
  a: EX1_RESPONSES,
  b: EX1.b.map((c) => ({ ...c })),
  ms: { A: 61_400, B: 45_600, pick: 0 },
  startedAt: '2026-10-30T01:00:00.000Z',
  finishedAt: '2026-10-30T01:05:00.000Z',
  ...over,
});

const NOW = new Date('2026-10-30T02:03:04.000Z');

describe('응답 파일 만들기', () => {
  it('끝낸 응답만 내보낸다', () => {
    expect(buildPilotRecord(finished({ finishedAt: null }), null, NOW)).toBeNull();
  });

  it('문항별 응답, 순서, 시간, 결과를 담고 이름은 담지 않는다', () => {
    const r = buildPilotRecord(finished(), '  P07 ', NOW)!;
    expect(r.label).toBe('P07');
    expect(r.a).toEqual(EX1_RESPONSES);
    expect(r.aOrder).toHaveLength(20);
    expect(r.b[0]).toMatchObject({ id: 'B1', best: 'P', worst: 'M' });
    expect(r.b[0].order).toHaveLength(5);
    expect(r.seconds).toEqual({ A: 61, B: 46, pick: 0 });
    expect(r.result).toEqual({ core: 'P', second: 'S' });
    expect(Object.keys(r)).not.toContain('nick');
    expect(pilotFileName(r)).toBe('wow-index-pilot-202610300203-P07.json');
  });
});

describe('응답 파일 읽기', () => {
  const r = buildPilotRecord(finished(), 'P01', NOW)!;
  const s = buildPilotRecord(finished(), 'P02', NOW)!;

  it('객체 하나, 배열, 이어 붙인 여러 객체를 모두 읽는다', () => {
    expect(parsePilotText(JSON.stringify(r)).records).toHaveLength(1);
    expect(parsePilotText(JSON.stringify([r, s])).records).toHaveLength(2);
    expect(parsePilotText(JSON.stringify(r, null, 2) + '\n' + JSON.stringify(s, null, 2)).records).toHaveLength(2);
  });

  it('형식이 다른 것은 세어서 뺀다', () => {
    expect(parsePilotText(JSON.stringify([r, { kind: 'x' }]))).toEqual({ records: [r], bad: 1 });
    expect(parsePilotText('not json')).toEqual({ records: [], bad: 1 });
    expect(parsePilotText(JSON.stringify({ ...r, a: { ...r.a, A01: 9 } })).records).toHaveLength(0);
  });
});

describe('통계', () => {
  it('상관: 완전 비례 1, 반비례 −1, 값이 모두 같으면 계산하지 않음', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1);
    expect(pearson([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1);
    expect(pearson([3, 3, 3], [1, 2, 3])).toBeNull();
  });

  it('크론바흐 알파: 두 문항이 같으면 1, 알려진 예와 일치', () => {
    expect(cronbachAlpha([[1, 1], [2, 2], [3, 3]])).toBeCloseTo(1);
    // 문항 분산 1, 1, 0 / 총점(6, 6, 9) 분산 3 → 3/2 × (1 − 2/3) = 0.5
    expect(cronbachAlpha([[1, 2, 3], [2, 1, 3], [3, 3, 3]])).toBeCloseTo(0.5);
    expect(cronbachAlpha([[1, 1]])).toBeNull();
  });

  it('중앙값', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it('원형별 문항 분석은 4문항씩, 유형·상황 집계', () => {
    const shift = (d: number): PilotRecord => {
      const base = buildPilotRecord(finished(), null, NOW)!;
      return { ...base, a: Object.fromEntries(ITEMS.map((i) => [i.id, Math.min(5, Math.max(1, EX1_RESPONSES[i.id] + d))])) };
    };
    const rs = [shift(-1), shift(0), shift(1)];
    const stats = itemAnalysis(rs);
    expect(stats.map((s) => s.items.length)).toEqual([4, 4, 4, 4, 4]);
    expect(stats[0].archetype).toBe('P');
    expect(stats[0].items[0]).toMatchObject({ id: 'A01', mean: 14 / 3 });
    expect(coreCounts(rs).P).toBe(3);
    expect(scenarioCounts(rs)[0]).toEqual({ id: 'B1', best: { P: 3, B: 0, S: 0, G: 0, M: 0 }, worst: { P: 0, B: 0, S: 0, G: 0, M: 3 } });
  });
});

describe('CSV', () => {
  it('BOM, 머리줄, 참여자 한 줄씩', () => {
    const r = buildPilotRecord(finished(), 'P, "07"', NOW)!;
    const csv = toCsv([r]);
    expect(csv.startsWith('﻿label,exported_at,core,second,A01,')).toBe(true);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1].startsWith('"P, ""07""",2026-10-30T02:03:04.000Z,P,S,5,5,4,4,')).toBe(true);
    expect(lines[0].split(',')).toHaveLength(4 + 20 + 12 + 4);
  });
});
