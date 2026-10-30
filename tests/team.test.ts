import { describe, expect, it } from 'vitest';
import { countLabel, smallTeamText } from '../src/data/teamText';
import { encode } from '../src/codec';
import {
  CYCLE,
  displayName,
  extremes,
  membersByArchetype,
  parseTeamCodes,
  scenarioDistribution,
  totals,
  typeDistribution,
  type Member,
} from '../src/team';
import { EX1, makeSummary, pairs, sums } from './fixtures';

describe('팀 코드 붙여 넣기', () => {
  it('여러 줄을 읽고, 잘못된 줄과 중복을 따로 알린다', () => {
    const a = encode(EX1, '가나');
    const b = encode(makeSummary());
    const text = [a, '', 'not-a-code!', `https://example.org/index.html#/result/${b}`, a].join('\n');
    const r = parseTeamCodes(text);
    expect(r.members.map((m) => m.nick)).toEqual(['가나', null]);
    expect(r.members[0].summary).toEqual(EX1);
    expect(r.errors).toEqual([{ line: 3, error: 'malformed' }]);
    expect(r.duplicates).toEqual([5]);
  });
});

describe('분포', () => {
  const ms: Member[] = [
    { nick: 'a', summary: EX1 },
    { nick: 'b', summary: makeSummary({ aSum: sums(3, 3, 3, 3, 3), b: pairs('MP', 'MP', 'MP', 'BS', 'GB', 'GS'), picks: { core: 'M', second: 'G' } }) },
    { nick: 'c', summary: makeSummary({ aSum: sums(2, 4.5, 2, 2, 4), b: pairs('BM', 'BS', 'SG', 'GM', 'MP', 'PB') }) },
  ];

  it('상황마다 누가 어떤 역할을 골랐는지', () => {
    const dist = scenarioDistribution(ms);
    expect(dist).toHaveLength(6);
    expect(dist[0].best).toEqual({ P: [0], B: [2], S: [], G: [], M: [1] });
    expect(dist[0].worst).toEqual({ P: [1], B: [], S: [], G: [], M: [0, 2] });
  });

  it('팀원별 주·보조 유형과 원형별 사람 수(순위 없음)', () => {
    const d = typeDistribution(ms);
    expect(d.types).toEqual([
      { core: 'P', second: 'S' },
      { core: 'M', second: 'G' },
      { core: 'B', second: 'M' },
    ]);
    expect(d.core).toEqual({ P: 1, B: 1, S: 0, G: 0, M: 1 });
    expect(d.second).toEqual({ P: 0, B: 0, S: 1, G: 1, M: 1 });
  });
});

describe('팀 구성과 다섯 방식의 균형', () => {
  const ms: Member[] = [
    { nick: '가', summary: EX1 },
    { nick: null, summary: makeSummary({ aSum: sums(2, 4.5, 2, 2, 4), b: pairs('BM', 'BS', 'SG', 'GM', 'MP', 'PB') }) },
  ];

  it('표시 이름: 별명, 없으면 팀원 n, 숨기면 모두 팀원 n', () => {
    expect(displayName(ms[0], 0, false)).toBe('가');
    expect(displayName(ms[1], 1, false)).toBe('팀원 2');
    expect(displayName(ms[0], 0, true)).toBe('팀원 1');
  });

  it('원형별로 주·보조 유형인 팀원', () => {
    const by = membersByArchetype(ms);
    expect(by.P).toEqual({ core: [0], second: [] });
    expect(by.S).toEqual({ core: [], second: [0] });
    expect(by.B).toEqual({ core: [1], second: [] });
    expect(by.M).toEqual({ core: [], second: [1] });
    expect(by.G).toEqual({ core: [], second: [] });
  });

  it('오각형 꼭짓점은 일의 흐름 순서', () => {
    expect(CYCLE).toEqual(['P', 'B', 'G', 'M', 'S']);
  });

  it('원형별 주·보조 인원 합과 가장 많은·적은 방식', () => {
    const d = typeDistribution(ms);
    const t = totals(d.core, d.second);
    expect(t).toEqual({ P: 1, B: 1, S: 1, G: 0, M: 1 });
    expect(extremes(t)).toEqual({ most: ['P', 'B', 'M', 'S'], least: ['G'] });
    expect(extremes({ P: 2, B: 2, S: 2, G: 2, M: 2 })).toBeNull();
    expect(extremes({ P: 3, B: 1, S: 0, G: 3, M: 0 })).toEqual({ most: ['P', 'G'], least: ['M', 'S'] });
  });
});

describe('팀 화면 문구', () => {
  it('방식별 인원 표시', () => {
    expect(countLabel('P', 2, 1)).toBe('Prototyper(주 2명 · 보조 1명)');
    expect(countLabel('B', 0, 3)).toBe('Builder(보조 3명)');
    expect(countLabel('M', 0, 0)).toBe('Maintainer(없음)');
  });

  it('팀원이 적을 때', () => {
    expect(smallTeamText(3)).toBe('팀원이 3명이라 한 사람의 결과에 따라 모양이 크게 달라집니다.');
  });
});
