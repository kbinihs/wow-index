import { describe, expect, it } from 'vitest';
import { decode, encode, extractCode, NICK_MAX } from '../src/codec';
import { EX1, makeSummary, pairs, sums } from './fixtures';

const rawCode = (obj: unknown) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const payloadOf = (code: string) => {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
};
const validPayload = () => payloadOf(encode(EX1));

/** A·B가 모두 같아 주 유형을 골라야 하는 요약 */
const TIED = makeSummary({ aSum: sums(3, 3, 3, 3, 3), b: pairs('PM', 'PM', 'BS', 'BG', 'SM', 'GP') });

describe('왕복', () => {
  it('인코딩 → 디코딩 결과가 같다', () => {
    expect(decode(encode(EX1))).toEqual({ ok: true, summary: EX1, nick: null });
  });

  it('한글 별명과 본인이 고른 유형 포함', () => {
    const s = { ...TIED, picks: { core: 'B' as const } };
    expect(decode(encode(s, '  초록 사과 '))).toEqual({ ok: true, summary: s, nick: '초록 사과' });
  });

  it('URL에 그대로 쓸 수 있는 글자만 쓴다', () => {
    expect(encode(EX1, '가나다')).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('A 문항별 응답은 들어가지 않는다', () => {
    expect(Object.keys(validPayload()).sort()).toEqual(['a', 'b', 'v']);
    expect(validPayload().a).toEqual([4.5, 3, 4.25, 2.75, 2]);
  });

  it('별명은 20자에서 자른다', () => {
    const r = decode(encode(EX1, '가'.repeat(30)));
    expect(r.ok && r.nick).toBe('가'.repeat(NICK_MAX));
  });
});

describe('잘못된 코드', () => {
  it('빈 입력', () => expect(decode('   ')).toEqual({ ok: false, error: 'empty' }));
  it('base64url 글자가 아님', () => expect(decode('abc$%')).toEqual({ ok: false, error: 'malformed' }));
  it('JSON이 아님', () => expect(decode(btoa('hello').replace(/=+$/, ''))).toEqual({ ok: false, error: 'malformed' }));
  it('객체가 아님', () => expect(decode(rawCode([1, 2, 3]))).toEqual({ ok: false, error: 'malformed' }));
  it('잘린 코드', () => expect(decode(encode(EX1).slice(0, 30)).ok).toBe(false));

  it('값이 범위를 벗어남', () => {
    const cases = [
      { a: [5.5, 3, 4.25, 2.75, 2] },
      { a: [4.1, 3, 4.25, 2.75, 2] },
      { b: ['PP', 'PM', 'PM', 'BS', 'SB', 'SG'] },
      { b: ['PX', 'PM', 'PM', 'BS', 'SB', 'SG'] },
      { b: ['PM', 'PM', 'PM', 'BS', 'SB'] },
      { p: { c: 'X' } },
      { p: 'P' },
      { n: '가'.repeat(NICK_MAX + 1) },
      { n: 3 },
    ];
    for (const patch of cases) {
      expect(decode(rawCode({ ...validPayload(), ...patch })), JSON.stringify(patch)).toEqual({ ok: false, error: 'invalid' });
    }
  });

  it('동점인데 고른 유형이 없으면 열지 않는다', () => {
    expect(decode(encode(TIED))).toEqual({ ok: false, error: 'invalid' });
  });
});

describe('버전', () => {
  it('이전 버전(v2: 시간·에너지 포함)은 안내 후 거부', () => {
    const v2 = { v: 2, a: [4.5, 3, 4.25, 2.75, 2], b: ['PM', 'PM', 'PM', 'BS', 'SB', 'SG'], c: [10, 15, 5, 20, 45, 5] };
    expect(decode(rawCode(v2))).toEqual({ ok: false, error: 'old-version' });
  });

  it('버전 표시가 없는 v0.1 형식도 이전 버전', () => {
    expect(decode(rawCode({ tendency: [80, 45.4, 75.4, 35.8, 18.3] }))).toEqual({ ok: false, error: 'old-version' });
  });

  it('v3(원글 정의로 고치기 전 문항)도 이전 버전', () => {
    expect(decode(rawCode({ ...validPayload(), v: 3 }))).toEqual({ ok: false, error: 'old-version' });
  });

  it('v4(응답 척도를 맡고 싶음으로 바꾸기 전 문항)도 이전 버전', () => {
    expect(decode(rawCode({ ...validPayload(), v: 4 }))).toEqual({ ok: false, error: 'old-version' });
  });

  it('더 새 버전은 따로 알린다', () => {
    expect(decode(rawCode({ ...validPayload(), v: 6 }))).toEqual({ ok: false, error: 'unsupported-version' });
  });
});

describe('붙여 넣은 글에서 코드만 꺼내기', () => {
  const code = encode(EX1, '가나');
  it('결과 링크, 메신저에서 복사한 줄, 코드만', () => {
    expect(extractCode(`https://example.org/index.html#/result/${code}`)).toBe(code);
    expect(extractCode(`[홍길동] [오후 3:12] ${code}`)).toBe(code);
    expect(extractCode(`홍길동: ${code}`)).toBe(code);
    expect(extractCode(`  ${code}  `)).toBe(code);
  });
  it('코드가 아니면 그대로 넘겨 오류 안내를 받게 한다', () => {
    expect(extractCode(' abc$ ')).toBe('abc$');
  });
});
