import { describe, expect, it } from 'vitest';
import { A_GUIDE, ITEMS, LIKERT_LABELS } from '../src/data/items';
import { SCENARIOS } from '../src/data/scenarios';
import { ARCHETYPES } from '../src/types';

describe('문항 설계', () => {
  it('원형마다 네 문항, 원글 정의의 서로 다른 갈래를 하나씩 맡는다', () => {
    for (const a of ARCHETYPES) {
      const items = ITEMS.filter((i) => i.archetype === a);
      expect(items, a).toHaveLength(4);
      expect(new Set(items.map((i) => i.facet)).size, a).toBe(4);
    }
  });

  it('같은 문구가 두 번 나오지 않는다', () => {
    expect(new Set(ITEMS.map((i) => i.text)).size).toBe(ITEMS.length);
    const roles = SCENARIOS.flatMap((sc) => Object.values(sc.roles));
    expect(new Set(roles).size).toBe(roles.length);
  });

  it('업무 선호도 상황 선택과 같은 말(맡고 싶음)로 묻는다', () => {
    expect([A_GUIDE, ...LIKERT_LABELS].join(' ')).not.toMatch(/끌리|끌림/);
    expect(A_GUIDE).toContain('얼마나 맡고 싶은지');
  });

  it('덜어 내는 Sweeper와 키우는 Grower가 서로의 말을 쓰지 않는다', () => {
    for (const i of ITEMS.filter((x) => x.archetype === 'S')) expect(i.text, i.id).not.toMatch(/키우/);
    for (const i of ITEMS.filter((x) => x.archetype === 'G')) expect(i.text, i.id).not.toMatch(/줄이|빼|그만/);
  });
});
