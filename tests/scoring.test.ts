import { describe, expect, it } from 'vitest';
import {
  combo,
  COMBOS,
  GROWTH,
  CLOSE_PAIR_TEXT,
  FLAT_TEXT,
  GROWTH_LEAD,
  leadText,
  NAMES,
  PARTNER_LEAD,
  PARTNER_LEAD_FLAT,
  PARTNER_NONE,
  PARTNER,
  pickedText,
  pickText,
  PROFILES,
  typeName,
} from '../src/data/profiles';
import { aSumsFromResponses, DELTA, neededPicks, place, rankGroups, score } from '../src/scoring';
import { ARCHETYPES } from '../src/types';
import { EX1, EX1_RESPONSES, makeSummary, pairs, sums } from './fixtures';

const zero = { P: 0, B: 0, S: 0, G: 0, M: 0 };

describe('예시 1(4.7의 A·B)', () => {
  const r = score(EX1);

  it('문항 응답에서 원형별 합계를 만든다', () => {
    expect(aSumsFromResponses(EX1_RESPONSES)).toEqual(EX1.aSum);
  });

  it('주 Prototyper, 보조 Sweeper, 성장 Builder, 짝 Grower·Maintainer', () => {
    expect(r.placement).toEqual({ core: 'P', second: 'S', growth: ['B'], partners: ['G', 'M'], pending: null });
    expect(typeName('P', 'S')).toBe('Prototyper-Sweeper');
  });

  it('주·보조 차이 0.25 < δ → 차이가 크지 않다는 문장, 다섯 방식은 고르지 않음', () => {
    expect(DELTA).toBe(0.5);
    expect(r.closePair).toBe(true);
    expect(r.flat).toBe(false);
  });

  it('머리 문장은 일 이름으로, 횟수 대신 순서로 말한다', () => {
    expect(leadText('P', 'S')).toBe('선택한 답을 모아 보니 새 아이디어를 내고 만들어 보는 일이 가장 앞섰고, 그다음은 다듬고 덜어 내는 일이었습니다.');
    expect(leadText('G', 'M')).toBe(
      '선택한 답을 모아 보니 진행 중인 사업을 반응에 맞춰 키우는 일이 가장 앞섰고, 그다음은 자리 잡은 사업을 튼튼하게 지키는 일이었습니다.',
    );
  });

  it('조합 풀이는 주-보조 순서로 찾는다', () => {
    expect(combo('P', 'S').how).toBe('많이 만들어 보고, 안 되는 것은 빨리 걷어 냅니다. 일이 쓸데없이 늘어나지 않게 합니다.');
    expect(combo('S', 'P').how).toBe('군더더기를 걷어 내고, 비운 자리에서 새로운 것을 시도합니다.');
  });
});

describe('순위와 동점', () => {
  it('A 합계 → B 가장 맡고 싶음 횟수, 둘 다 같으면 한 묶음', () => {
    expect(rankGroups(sums(3, 3, 3, 3, 3), { P: 2, B: 2, S: 1, G: 1, M: 0 })).toEqual([['P', 'B'], ['S', 'G'], ['M']]);
    expect(rankGroups(sums(4, 4, 2.5, 3.75, 2.25), { ...zero, B: 2, P: 1 })).toEqual([['B'], ['P'], ['G'], ['S'], ['M']]);
  });

  it('A가 같으면 B 횟수로 주 유형이 갈린다(예시 3)', () => {
    const r = score(makeSummary({ aSum: sums(4, 4, 2.5, 3.75, 2.25), b: pairs('BM', 'BM', 'PS', 'SG', 'MP', 'GS') }));
    expect(r.placement).toEqual({ core: 'B', second: 'P', growth: ['G'], partners: ['S', 'M'], pending: null });
  });

  it('A·B 모두 같으면 본인이 고른다', () => {
    const s = makeSummary({ aSum: sums(3, 3, 3, 3, 3), b: pairs('PM', 'PM', 'BS', 'BG', 'SM', 'GP') });
    expect(score(s).placement.pending).toEqual({ slot: 'core', candidates: ['P', 'B'] });
    const r = score({ ...s, picks: { core: 'B' } });
    expect(r.placement).toEqual({ core: 'B', second: 'P', growth: ['S', 'G'], partners: ['M'], pending: null });
  });

  it('셋이 같으면 주 유형과 보조 유형을 차례로 고른다', () => {
    const s = makeSummary({ aSum: sums(3, 3, 3, 3, 3), b: pairs('PM', 'PM', 'BG', 'BG', 'SM', 'SM') });
    expect(score(s).placement.pending).toEqual({ slot: 'core', candidates: ['P', 'B', 'S'] });
    expect(score({ ...s, picks: { core: 'S' } }).placement.pending).toEqual({ slot: 'second', candidates: ['P', 'B'] });
    expect(score({ ...s, picks: { core: 'S', second: 'B' } }).placement).toEqual({
      core: 'S',
      second: 'B',
      growth: ['P'],
      partners: ['G', 'M'],
      pending: null,
    });
  });

  it('후보에 없는 선택은 무시한다', () => {
    const s = makeSummary({ aSum: sums(3, 3, 3, 3, 3), b: pairs('PM', 'PM', 'BS', 'BG', 'SM', 'GP') });
    expect(score({ ...s, picks: { core: 'M' } }).placement.pending?.slot).toBe('core');
  });

  it('3위가 여럿이면 모두 성장 방향, 그 아래가 없으면 짝 없음', () => {
    const r = score(makeSummary({ aSum: sums(3, 3, 3, 3, 3), b: pairs('PS', 'PG', 'PM', 'BS', 'BG', 'BM'), picks: { core: 'P' } }));
    expect(r.placement).toEqual({ core: 'P', second: 'B', growth: ['S', 'G', 'M'], partners: [], pending: null });
    expect(r.flat).toBe(true);
  });

  it('실제로 동점이 아닌 자리의 선택은 버린다', () => {
    expect(neededPicks(EX1.aSum, { P: 3, B: 1, S: 2, G: 0, M: 0 }, { core: 'M', second: 'G' })).toEqual({});
    const aSum = sums(3, 3, 3, 3, 3);
    const best = { P: 2, B: 2, S: 1, G: 1, M: 0 };
    expect(neededPicks(aSum, best, { core: 'B', second: 'G' })).toEqual({ core: 'B' });
    expect(place(aSum, best, { core: 'B' }).second).toBe('P');
  });
});

describe('입력 검증', () => {
  it('문항 응답이 빠지거나 범위를 벗어나면 거부', () => {
    const { A20: _, ...missing } = EX1_RESPONSES;
    expect(() => aSumsFromResponses(missing)).toThrow(RangeError);
    expect(() => aSumsFromResponses({ ...EX1_RESPONSES, A01: 6 })).toThrow(RangeError);
  });

  it('잘못된 요약은 채점하지 않는다', () => {
    expect(() => score({ ...EX1, b: pairs('PP', 'PM', 'PM', 'BS', 'SB', 'SG') })).toThrow(RangeError);
    expect(() => score({ ...EX1, aSum: { ...EX1.aSum, P: 21 } })).toThrow(RangeError);
  });
});

describe('문구', () => {
  it('동점 고르기 문장', () => {
    expect(pickText(['P', 'B'])).toBe('Prototyper와 Builder의 점수가 같습니다. 둘 중 나와 더 가깝다고 생각하는 쪽을 골라 주세요.');
    expect(pickText(['P', 'B', 'S'])).toBe(
      'Prototyper, Builder와 Sweeper의 점수가 같습니다. 이 가운데 나와 가장 가깝다고 생각하는 쪽을 골라 주세요.',
    );
  });

  it('동점이라 직접 고른 자리 안내', () => {
    expect(pickedText({})).toBeNull();
    expect(pickedText({ core: 'B' })).toBe('주 유형은 점수가 같은 방식 가운데 직접 골랐습니다.');
    expect(pickedText({ second: 'B' })).toBe('보조 유형은 점수가 같은 방식 가운데 직접 골랐습니다.');
    expect(pickedText({ core: 'S', second: 'B' })).toBe('주 유형과 보조 유형은 점수가 같은 방식 가운데 직접 골랐습니다.');
  });

  it('조합 20개, 짝 문구 20칸, 성장 방향 5개, 프로필 5개가 모두 있다', () => {
    for (const c of ARCHETYPES) {
      expect(PROFILES[c].values && PROFILES[c].strengths.length && PROFILES[c].cautions.length).toBeTruthy();
      expect(GROWTH[c]).toBeTruthy();
      for (const s of ARCHETYPES) {
        if (c === s) continue;
        expect(COMBOS[`${c}-${s}`], `${c}-${s}`).toBeDefined();
        expect(PARTNER[c][s], `${c}→${s}`).toBeTruthy();
      }
    }
    expect(Object.keys(COMBOS)).toHaveLength(20);
  });

  it('머리 문장에는 원형 이름 대신 일 이름을 쓴다', () => {
    const names = Object.values(NAMES);
    for (const [c, s2] of [['P', 'S'], ['M', 'G']] as const) {
      const text = leadText(c, s2);
      expect(names.filter((n) => text.includes(n)), text).toEqual([]);
    }
  });

  it("결과 문구에 '끌림'·'끌렸' 대신 '선택'을 쓴다", () => {
    const texts = [
      leadText('P', 'S'),
      CLOSE_PAIR_TEXT,
      FLAT_TEXT,
      GROWTH_LEAD,
      PARTNER_LEAD,
      PARTNER_LEAD_FLAT,
      PARTNER_NONE,
      pickedText({ core: 'P', second: 'B' })!,
      ...Object.values(COMBOS).flatMap((c) => [c.how, c.caution]),
      ...Object.values(GROWTH),
      ...ARCHETYPES.flatMap((a) => Object.values(PARTNER[a]) as string[]),
      ...ARCHETYPES.flatMap((a) => Object.values(PROFILES[a]).flat()),
    ];
    for (const t of texts) expect(t, t).not.toMatch(/끌림|끌렸|끌리/);
  });

  it('지시형 문장을 쓰지 않는다', () => {
    const texts = [
      ...Object.values(COMBOS).flatMap((c) => [c.how, c.caution]),
      ...Object.values(GROWTH),
      ...ARCHETYPES.flatMap((a) => Object.values(PROFILES[a]).flat()),
    ];
    for (const t of texts) expect(t, t).not.toMatch(/(세요|십시오|하라)[.!]?$/);
  });
});
