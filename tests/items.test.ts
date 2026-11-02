import { describe, expect, it } from 'vitest';
import { A_GUIDE, ITEMS, LIKERT_LABELS } from '../src/data/items';
import { SCENARIOS } from '../src/data/scenarios';
import { ARCHETYPES, type Archetype } from '../src/types';

/** 화면에 보이는 글자 수(공백 포함) */
const len = (s: string) => [...s].length;
const ROLES = SCENARIOS.flatMap((sc) => ARCHETYPES.map((a) => ({ id: `${sc.id}${a}`, archetype: a, text: sc.roles[a] })));

describe('문항 설계', () => {
  it('문항 ID와 원형 배정이 고정되어 있다(P: A01–04, B: A05–08, S: A09–12, G: A13–16, M: A17–20)', () => {
    expect(ITEMS.map((i) => i.id)).toEqual(Array.from({ length: 20 }, (_, k) => `A${String(k + 1).padStart(2, '0')}`));
    ITEMS.forEach((item, k) => expect(item.archetype, item.id).toBe(ARCHETYPES[Math.floor(k / 4)]));
  });

  it('원형마다 네 문항, 원글 정의의 서로 다른 갈래를 하나씩 맡는다', () => {
    for (const a of ARCHETYPES) {
      const items = ITEMS.filter((i) => i.archetype === a);
      expect(items, a).toHaveLength(4);
      expect(new Set(items.map((i) => i.facet)).size, a).toBe(4);
    }
  });

  it('같은 문구가 두 번 나오지 않는다', () => {
    expect(new Set(ITEMS.map((i) => i.text)).size).toBe(ITEMS.length);
    expect(new Set(ROLES.map((r) => r.text)).size).toBe(ROLES.length);
  });

  it('업무 선호도 상황 선택과 같은 말(맡고 싶음)로 묻는다', () => {
    expect([A_GUIDE, ...LIKERT_LABELS].join(' ')).not.toMatch(/끌리|끌림/);
    expect(A_GUIDE).toContain('얼마나 맡고 싶은지');
  });

  it('문항은 길이가 비슷하고(20–38자) 모두 "~기"로 끝난다', () => {
    for (const i of ITEMS) {
      expect(len(i.text), i.id).toBeGreaterThanOrEqual(20);
      expect(len(i.text), i.id).toBeLessThanOrEqual(38);
      expect(i.text, i.id).toMatch(/기$/);
    }
  });

  it('덜어 내는 Sweeper와 키우는 Grower가 서로의 말을 쓰지 않는다(문항과 역할 모두)', () => {
    for (const i of [...ITEMS, ...ROLES].filter((x) => x.archetype === 'S')) expect(i.text, i.id).not.toMatch(/키우/);
    for (const i of [...ITEMS, ...ROLES].filter((x) => x.archetype === 'G')) expect(i.text, i.id).not.toMatch(/줄이|빼|그만/);
  });

  it('직무·직급과 상관없이 답할 수 있다: 절대어나 결정권이 있어야 하는 일을 쓰지 않는다', () => {
    for (const x of [...ITEMS, ...ROLES]) {
      expect(x.text, x.id).not.toMatch(/아무도|누구도/);
      expect(x.text, x.id).not.toMatch(/승인|예산|협약/);
    }
  });
});

describe('상황 선택 설계', () => {
  it('상황은 B1–B6 여섯 개, 상황마다 다섯 방식의 역할이 하나씩 있다', () => {
    expect(SCENARIOS.map((sc) => sc.id)).toEqual(['B1', 'B2', 'B3', 'B4', 'B5', 'B6']);
    for (const sc of SCENARIOS) expect(Object.keys(sc.roles).sort(), sc.id).toEqual([...ARCHETYPES].sort());
  });

  it('상황은 합니다체 한 문장이다', () => {
    for (const sc of SCENARIOS) expect(sc.situation, sc.id).toMatch(/^[^.\n]+니다\.$/);
  });

  it('역할은 모두 "~는 역할"로 끝나고, 한 상황 안에서 길이 차이가 10자 이내다', () => {
    for (const sc of SCENARIOS) {
      const texts = ARCHETYPES.map((a: Archetype) => sc.roles[a]);
      for (const t of texts) expect(t, sc.id).toMatch(/는 역할$/);
      const ls = texts.map(len);
      expect(Math.max(...ls) - Math.min(...ls), sc.id).toBeLessThanOrEqual(10);
    }
  });
});
