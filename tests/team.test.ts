import { describe, expect, it } from 'vitest';
import { countLabel, smallTeamText } from '../src/data/teamText';
import { encode } from '../src/codec';
import {
  CYCLE,
  displayName,
  extremes,
  membersByArchetype,
  phaseGaps,
  referenceShape,
  parseTeamCodes,
  parseTeamSources,
  looksLikeCode,
  teamGroups,
  filterByTeam,
  defaultTeamKey,
  totals,
  typeDistribution,
  type Member,
} from '../src/team';
import { EX1, makeSummary, pairs, sums } from './fixtures';

describe('팀 코드 붙여 넣기', () => {
  it('여러 줄을 읽고, 잘못된 코드와 중복을 따로 알린다', () => {
    const a = encode(EX1, '가나');
    const b = encode(makeSummary());
    const text = [a, '', a.slice(0, 20), `https://example.org/index.html#/result/${b}`, a].join('\n');
    const r = parseTeamCodes(text);
    expect(r.members.map((m) => m.nick)).toEqual(['가나', null]);
    expect(r.members[0].summary).toEqual(EX1);
    expect(r.errors).toEqual([{ source: null, line: 3, error: 'malformed', text: `${a.slice(0, 14)}…` }]);
    expect(r.duplicates).toEqual([{ source: null, line: 5 }]);
  });

  it('메신저에서 복사한 줄(이름·시각이 앞에 붙은 줄)에서도 코드만 읽는다', () => {
    const a = encode(EX1, '가나');
    const b = encode(makeSummary());
    const r = parseTeamCodes([`[홍길동] [오후 3:12] ${a}`, `홍길동: ${b}`].join('\n'));
    expect(r.members.map((m) => m.nick)).toEqual(['가나', null]);
    expect(r.errors).toEqual([]);
  });

  it('대화방을 통째로 붙여 넣으면 코드가 없는 줄은 오류 없이 건너뛴다', () => {
    const a = encode(EX1, '가나', '기획팀');
    const text = [
      '2026년 11월 13일 금요일',
      '[가나] [오후 3:12] WoW Index 결과 · 가나 · 기획팀',
      `[가나] [오후 3:12] https://wow.example.org/#/result/${a}`,
      '[다라] [오후 3:15] 저도 곧 할게요!',
      'not-a-code!',
    ].join('\n');
    const r = parseTeamCodes(text);
    expect(r.members).toHaveLength(1);
    expect(r.members[0]).toMatchObject({ nick: '가나', team: '기획팀' });
    expect(r.errors).toEqual([]);
    expect(r.skipped).toBe(4);
  });

  it('카카오톡 대화 내보내기 형식(날짜, 이름 : 내용)의 줄도 읽는다', () => {
    const a = encode(EX1, '가나', '기획팀');
    const r = parseTeamCodes([`2026. 11. 13. 오후 3:12, 가나 : WoW Index 결과 · 가나 · 기획팀`, a].join('\n'));
    expect(r.members.map((m) => m.nick)).toEqual(['가나']);
  });

  it('같은 팀·같은 별명이 여러 번 보냈으면 마지막 것만 쓰고 알린다', () => {
    const first = encode(EX1, '가나', '기획팀');
    const again = encode(makeSummary(), '가나', '기획팀');
    const otherTeam = encode(makeSummary(), '가나', '운영팀');
    const r = parseTeamCodes([first, encode(makeSummary(), '다라', '기획팀'), again, otherTeam].join('\n'));
    expect(r.members.map((m) => [m.nick, m.team])).toEqual([
      ['가나', '기획팀'],
      ['다라', '기획팀'],
      ['가나', '운영팀'],
    ]);
    expect(r.members[0].summary).toEqual(makeSummary());
    expect(r.replaced).toEqual([{ nick: '가나', team: '기획팀', count: 2, used: { source: null, line: 3 } }]);
  });

  it('별명이 없는 코드는 같은 사람인지 알 수 없어 모두 쓴다', () => {
    const r = parseTeamCodes([encode(EX1), encode(makeSummary())].join('\n'));
    expect(r.members).toHaveLength(2);
    expect(r.replaced).toEqual([]);
  });

  it('붙여 넣은 글과 올린 파일을 함께 읽고, 파일의 줄은 파일 이름으로 알린다', () => {
    const a = encode(EX1, '가나', '기획팀');
    const r = parseTeamSources([
      { label: null, text: a },
      { label: 'chat.txt', text: ['인사', a, encode(makeSummary(), '다라', '기획팀'), 'eyJ2IjoxMjM0'].join('\n') },
    ]);
    expect(r.members.map((m) => m.nick)).toEqual(['가나', '다라']);
    expect(r.duplicates).toEqual([{ source: 'chat.txt', line: 2 }]);
    expect(r.errors.map((e) => [e.source, e.line])).toEqual([['chat.txt', 4]]);
    expect(r.skipped).toBe(1);
  });

  it('코드처럼 보이는 줄만 읽는다', () => {
    expect(looksLikeCode('안녕하세요')).toBe(false);
    expect(looksLikeCode('https://zoom.us/j/1234567890')).toBe(false);
    expect(looksLikeCode('eyJ2Ijo2')).toBe(true);
    expect(looksLikeCode('https://a.org/#/result/abc')).toBe(true);
    expect(looksLikeCode('abcdefghijklmnop')).toBe(true);
  });

  it('읽지 못한 줄은 앞부분을 보여 줄 수 있게 남긴다(길면 줄임)', () => {
    expect(parseTeamCodes('x'.repeat(30)).errors).toEqual([{ source: null, line: 1, error: 'malformed', text: `${'x'.repeat(14)}…` }]);
  });
});

describe('팀별로 나눠 보기', () => {
  const m = (nick: string, team: string | null): Member => ({ nick, team, summary: EX1 });
  const ms = [m('a', '운영팀'), m('b', '기획팀'), m('c', null), m('d', '기획팀')];

  it('팀은 사람 많은 순, 팀 이름이 없는 코드는 맨 뒤', () => {
    expect(teamGroups(ms)).toEqual([
      { key: { kind: 'team', team: '기획팀' }, count: 2 },
      { key: { kind: 'team', team: '운영팀' }, count: 1 },
      { key: { kind: 'none' }, count: 1 },
    ]);
  });

  it('고른 팀만 보거나 모두 본다', () => {
    expect(filterByTeam(ms, { kind: 'team', team: '기획팀' }).map((x) => x.nick)).toEqual(['b', 'd']);
    expect(filterByTeam(ms, { kind: 'none' }).map((x) => x.nick)).toEqual(['c']);
    expect(filterByTeam(ms, { kind: 'all' })).toHaveLength(4);
  });

  it('처음 보여 줄 팀: 팀이 하나면 모두, 여럿이면 원하는 팀이 있을 때 그 팀', () => {
    const g = teamGroups(ms);
    expect(defaultTeamKey(g, ['운영팀', '기획팀'])).toEqual({ kind: 'team', team: '운영팀' });
    expect(defaultTeamKey(g, [null, '기획팀'])).toEqual({ kind: 'team', team: '기획팀' });
    expect(defaultTeamKey(g, ['없는팀'])).toEqual({ kind: 'all' });
    expect(defaultTeamKey(teamGroups([m('a', '기획팀')]), ['기획팀'])).toEqual({ kind: 'all' });
  });
});

describe('분포', () => {
  const ms: Member[] = [
    { nick: 'a', team: null, summary: EX1 },
    { nick: 'b', team: null, summary: makeSummary({ aSum: sums(3, 3, 3, 3, 3), b: pairs('MP', 'MP', 'MP', 'BS', 'GB', 'GS'), picks: { core: 'M', second: 'G' } }) },
    { nick: 'c', team: null, summary: makeSummary({ aSum: sums(2, 4.5, 2, 2, 4), b: pairs('BM', 'BS', 'SG', 'GM', 'MP', 'PB') }) },
  ];

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

  it('주·보조 유형은 상황 선택을 더한 합산 점수로 정한다', () => {
    // A 합계는 B 14 > P 13이지만 합산은 P 16 > B 12
    const flipped = makeSummary({ aSum: { P: 13, B: 14, S: 10, G: 9, M: 8 }, b: pairs('PB', 'PB', 'PM', 'SG', 'GM', 'MS') });
    expect(typeDistribution([{ nick: null, team: null, summary: flipped }]).types).toEqual([{ core: 'P', second: 'B' }]);
  });
});

describe('팀 구성과 다섯 방식의 균형', () => {
  const ms: Member[] = [
    { nick: '가', team: null, summary: EX1 },
    { nick: null, team: null, summary: makeSummary({ aSum: sums(2, 4.5, 2, 2, 4), b: pairs('BM', 'BS', 'SG', 'GM', 'MP', 'PB') }) },
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

  it('오각형 꼭짓점은 원글 번호(사업이 자라는) 순서', () => {
    expect(CYCLE).toEqual(['P', 'B', 'S', 'G', 'M']);
  });

  it('원형별 주·보조 인원 합과 가장 많은·적은 방식', () => {
    const d = typeDistribution(ms);
    const t = totals(d.core, d.second);
    expect(t).toEqual({ P: 1, B: 1, S: 1, G: 0, M: 1 });
    expect(extremes(t)).toEqual({ most: ['P', 'B', 'S', 'M'], least: ['G'] });
    expect(extremes({ P: 2, B: 2, S: 2, G: 2, M: 2 })).toBeNull();
    expect(extremes({ P: 3, B: 1, S: 0, G: 3, M: 0 })).toEqual({ most: ['P', 'G'], least: ['S', 'M'] });
  });
});

describe('사업 단계별 조합(원글)', () => {
  it('비교용 모양: 주·보조 자리 2n개를 똑같이, 또는 단계 조합 비율대로', () => {
    expect(referenceShape(5, null)).toEqual({ P: 2, B: 2, S: 2, G: 2, M: 2 });
    expect(referenceShape(6, 'new')).toEqual({ P: 4, B: 4, S: 4, G: 0, M: 0 });
    expect(referenceShape(7, 'growing')).toEqual({ P: 0, B: 4, S: 4, G: 4, M: 2 });
    expect(referenceShape(7, 'mature')).toEqual({ P: 0, B: 2, S: 4, G: 4, M: 4 });
  });

  it('필요한 방식, 필요한데 가장 적은 방식, 조합 밖의 방식', () => {
    expect(phaseGaps({ P: 4, B: 3, S: 2, G: 2, M: 3 }, 'mature')).toEqual({
      need: ['S', 'G', 'M'],
      some: ['B'],
      fewest: ['S', 'G'],
      outside: ['P'],
    });
    expect(phaseGaps({ P: 2, B: 2, S: 2, G: 0, M: 1 }, 'new')).toEqual({ need: ['P', 'B', 'S'], some: [], fewest: [], outside: ['M'] });
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
