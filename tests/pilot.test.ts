import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data/items';
import {
  abAgreement,
  bInfluence,
  buildPilotRecord,
  coreCounts,
  cronbachAlpha,
  itemAnalysis,
  median,
  parsePilotText,
  pearson,
  pilotFileName,
  recordKey,
  scenarioCounts,
  toCsv,
  type PilotRecord,
} from '../src/pilot';
import { newProgress, type Progress } from '../src/progress';
import { EX1, EX1_RESPONSES, pairs } from './fixtures';

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
    expect(parsePilotText(JSON.stringify([r, { kind: 'x' }]))).toEqual({ records: [r], bad: 1, old: 0 });
    expect(parsePilotText('not json')).toEqual({ records: [], bad: 1, old: 0 });
    expect(parsePilotText(JSON.stringify({ ...r, a: { ...r.a, A01: 9 } })).records).toHaveLength(0);
  });

  it('이전 버전(문항이나 계산 방식이 다른) 파일은 따로 센다', () => {
    expect(r.v).toBe(4);
    expect(parsePilotText(JSON.stringify({ ...r, v: 2 }))).toEqual({ records: [], bad: 0, old: 1 });
    expect(parsePilotText(JSON.stringify({ ...r, v: 3 }))).toEqual({ records: [], bad: 0, old: 1 });
  });

  it('칸이 빠지거나 깨진 파일은 오류 없이 뺀다', () => {
    const { aOrder: _a, ...noOrder } = r;
    const broken = [
      noOrder,
      { ...r, b: [null, ...r.b.slice(1)] },
      { ...r, a: null },
      { ...r, result: null },
      { ...r, seconds: null },
      { ...r, seconds: { A: 'x', B: 1, pick: 0 } },
    ];
    for (const x of broken) expect(parsePilotText(JSON.stringify(x))).toEqual({ records: [], bad: 1, old: 0 });
  });

  it('같은 응답을 여러 번 내보낸 파일은 열쇠가 같다', () => {
    expect(recordKey(r)).toBe(recordKey(s));
    expect(recordKey(r)).not.toBe(recordKey({ ...r, startedAt: '2026-01-01T00:00:00.000Z' }));
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
    expect(stats[0].items[0].cross).not.toBeNull();
    // A만으로 1위 P(마지막은 P·S 동점), B만으로 1위 P(가장 맡고 싶음 3 − 가장 맡고 싶지 않음 0)
    expect(abAgreement(rs)).toEqual({ match: 3, n: 3 });
    expect(bInfluence(rs)).toEqual({ changed: 0, n: 3 });
  });

  it('방법 간 일치와 B가 주 유형을 바꾼 사람', () => {
    // A만으로는 P(18)가 1위인데, 상황 선택에서 S를 네 번 가장 맡고 싶다고 골라 합산 1위가 S(21)
    const flipped = buildPilotRecord(finished({ b: pairs('SP', 'SP', 'SP', 'SM', 'BM', 'GM') }), null, NOW)!;
    expect(flipped.result).toEqual({ core: 'S', second: 'P' });
    expect(abAgreement([flipped])).toEqual({ match: 0, n: 1 });
    expect(bInfluence([flipped])).toEqual({ changed: 1, n: 1 });
    // 결과(result)와 상관없이 원자료로 센다
    const base = buildPilotRecord(finished(), null, NOW)!;
    expect(abAgreement([{ ...base, result: { core: 'M', second: 'G' } }])).toEqual({ match: 1, n: 1 });
    expect(bInfluence([{ ...base, result: { core: 'M', second: 'G' } }])).toEqual({ changed: 1, n: 1 });
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

  it('참여 번호가 =, +, -, @로 시작하면 수식으로 읽히지 않게 막는다', () => {
    const r = buildPilotRecord(finished(), '=1+1', NOW)!;
    expect(toCsv([r]).trim().split('\n')[1].startsWith("'=1+1,")).toBe(true);
  });
});
