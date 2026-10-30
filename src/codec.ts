import { ITEMS_PER_ARCHETYPE, place, bCounts, validateSummary } from './scoring';
import { ARCHETYPES, type Archetype, type Picks, type Summary } from './types';

/**
 * 결과 링크·팀 코드 = JSON → UTF-8 → base64url.
 * 담는 것: 버전, 별명(선택), A 평균 5개, B 상황별 best/worst, 동점일 때 본인이 고른 것.
 * A 문항별 응답은 넣지 않는다.
 */
/** v5: 응답 척도(끌림 → 맡고 싶음)와 문항·상황 문구를 고침. v4 이하 코드는 문항 뜻이 달라 열지 않는다. */
export const CODE_VERSION = 5;
export const NICK_MAX = 20;

interface Payload {
  v: number;
  n?: string;
  /** A 원형별 평균(P·B·S·G·M) */
  a: number[];
  /** B1–B6, 'PM' = best P, worst M */
  b: string[];
  /** 본인이 고른 주 유형(c)·보조 유형(s) */
  p?: { c?: string; s?: string };
}

export type DecodeError = 'empty' | 'malformed' | 'old-version' | 'unsupported-version' | 'invalid';

export type DecodeResult =
  | { ok: true; summary: Summary; nick: string | null }
  | { ok: false; error: DecodeError };

export const DECODE_ERROR_TEXT: Record<DecodeError, string> = {
  empty: '팀 코드나 결과 링크를 넣어 주세요.',
  malformed: '코드를 읽을 수 없습니다. 복사할 때 빠진 글자가 없는지 확인해 주세요.',
  'old-version':
    '이전 버전에서 만든 코드라 열 수 없습니다. 문항이나 계산 방식이 바뀌어, 코드를 만든 사람이 질문에 다시 답해 새 코드를 만들어야 합니다.',
  'unsupported-version': '이 페이지보다 새 버전에서 만든 코드입니다. 페이지를 새로 고친 뒤 다시 열어 주세요.',
  invalid: '코드 안의 값이 올바르지 않습니다. 코드가 바뀌거나 잘리지 않았는지 확인해 주세요.',
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

export function normalizeNick(nick: string | null | undefined): string | null {
  const t = (nick ?? '').trim().slice(0, NICK_MAX);
  return t ? t : null;
}

export function encode(summary: Summary, nick?: string | null): string {
  const n = normalizeNick(nick);
  const p = { ...(summary.picks.core ? { c: summary.picks.core } : {}), ...(summary.picks.second ? { s: summary.picks.second } : {}) };
  const payload: Payload = {
    v: CODE_VERSION,
    ...(n ? { n } : {}),
    a: ARCHETYPES.map((k) => summary.aSum[k] / ITEMS_PER_ARCHETYPE),
    b: summary.b.map((c) => c.best + c.worst),
    ...(Object.keys(p).length ? { p } : {}),
  };
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

const isArchetype = (ch: unknown): ch is Archetype => (ARCHETYPES as readonly unknown[]).includes(ch);

function toSummary(p: Record<string, unknown>): Summary | null {
  const { a, b } = p;
  if (!Array.isArray(a) || a.length !== 5 || !a.every((x) => typeof x === 'number' && Number.isFinite(x))) return null;
  if (!Array.isArray(b) || !b.every((x) => typeof x === 'string' && x.length === 2)) return null;
  const pairs = (b as string[]).map((x) => [x[0], x[1]]);
  if (!pairs.every(([bs, ws]) => isArchetype(bs) && isArchetype(ws))) return null;

  const picks: Picks = {};
  if (p.p !== undefined) {
    if (typeof p.p !== 'object' || p.p === null) return null;
    const { c, s } = p.p as Record<string, unknown>;
    if (c !== undefined) {
      if (!isArchetype(c)) return null;
      picks.core = c;
    }
    if (s !== undefined) {
      if (!isArchetype(s)) return null;
      picks.second = s;
    }
  }

  const summary: Summary = {
    aSum: Object.fromEntries(ARCHETYPES.map((k, i) => [k, (a as number[])[i] * ITEMS_PER_ARCHETYPE])) as Summary['aSum'],
    b: pairs.map(([bs, ws]) => ({ best: bs as Archetype, worst: ws as Archetype })),
    picks,
  };
  if (validateSummary(summary)) return null;
  // 받은 코드만으로 주·보조 유형이 정해져야 한다
  if (place(summary.aSum, bCounts(summary.b).best, picks).pending) return null;
  return summary;
}

/**
 * 붙여 넣은 글에서 코드 부분만. 결과 링크, 메신저에서 복사한 줄('[이름] [오후 3:12] 코드', '이름: 코드')도 받는다.
 * 코드는 늘 '{"v'의 base64인 'eyJ'로 시작한다.
 */
export function extractCode(input: string): string {
  const link = input.match(/#\/result\/([^\s?#]+)/);
  if (link) return link[1];
  const token = input.match(/eyJ[A-Za-z0-9_-]{16,}/);
  return (token ? token[0] : input).trim();
}

export function decode(input: string): DecodeResult {
  const code = input.trim();
  if (!code) return { ok: false, error: 'empty' };
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return { ok: false, error: 'malformed' };

  let parsed: unknown;
  try {
    const json = new TextDecoder('utf-8', { fatal: true }).decode(fromBase64Url(code));
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'malformed' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return { ok: false, error: 'malformed' };

  const p = parsed as Record<string, unknown>;
  // 버전 표시가 없으면 v0.1 시절 코드로 본다
  if (p.v === undefined || (typeof p.v === 'number' && p.v < CODE_VERSION)) return { ok: false, error: 'old-version' };
  if (p.v !== CODE_VERSION) return { ok: false, error: 'unsupported-version' };

  if (p.n !== undefined && (typeof p.n !== 'string' || p.n.length > NICK_MAX)) return { ok: false, error: 'invalid' };
  const summary = toSummary(p);
  if (!summary) return { ok: false, error: 'invalid' };
  return { ok: true, summary, nick: normalizeNick(p.n as string | undefined) };
}
