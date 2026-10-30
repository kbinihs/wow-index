import { describe, expect, it } from 'vitest';
import { noCoverText } from '../src/data/teamText';
import { encode } from '../src/codec';
import {
  displayName,
  membersByArchetype,
  parseTeamCodes,
  scenarioDistribution,
  stageCoverage,
  STAGES,
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

describe('팀 구성과 업무 단계', () => {
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

  it('업무 단계와 연결되는 원형(설계서 7.2)', () => {
    expect(STAGES.map((s) => `${s.label}:${s.archetype}`)).toEqual(['시도:P', '구축:B', '개선·확장:G', '유지:M', '정리·종료:S']);
  });

  it('업무가 있는 단계만, 그 단계 원형의 팀원과 함께', () => {
    const tasks = [
      { name: '보고서 양식 정리', stage: 'close' as const, note: '' },
      { name: ' ', stage: 'close' as const, note: '' },
      { name: '후원자 관계 관리', stage: 'keep' as const, note: '' },
      { name: '단계 안 고름', stage: null, note: '' },
    ];
    expect(stageCoverage(tasks, ms)).toEqual([
      { stage: STAGES[3], tasks: ['후원자 관계 관리'], core: [], second: [1] },
      { stage: STAGES[4], tasks: ['보고서 양식 정리', '이름 없는 업무'], core: [], second: [0] },
    ]);
    expect(stageCoverage([], ms)).toEqual([]);
  });
});

describe('팀 화면 문구', () => {
  it('업무 단계의 방식을 가진 팀원이 없을 때', () => {
    expect(noCoverText('정리·종료', 2, 'S')).toBe(
      '정리·종료 단계 업무가 2개인데, Sweeper를 주·보조 유형으로 가진 팀원이 없습니다. 누가 어떤 지원을 받아 맡을지 이야기해 볼 만합니다.',
    );
  });
});
