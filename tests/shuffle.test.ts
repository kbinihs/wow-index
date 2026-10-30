import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data/items';
import { hasRunOf3, mulberry32, shuffle, shuffleNoRun3 } from '../src/shuffle';

describe('A 문항 섞기', () => {
  it('같은 원형 3연속이 없고 20문항이 모두 한 번씩 나온다(시드 1000개)', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const order = shuffleNoRun3(ITEMS, (i) => i.archetype, mulberry32(seed));
      expect(hasRunOf3(order, (i) => i.archetype)).toBe(false);
      expect(order.map((i) => i.id).sort()).toEqual(ITEMS.map((i) => i.id));
    }
  });

  it('같은 시드면 같은 순서', () => {
    const a = shuffleNoRun3(ITEMS, (i) => i.archetype, mulberry32(42)).map((i) => i.id);
    const b = shuffleNoRun3(ITEMS, (i) => i.archetype, mulberry32(42)).map((i) => i.id);
    expect(a).toEqual(b);
  });

  it('3연속 판정', () => {
    expect(hasRunOf3(['P', 'P', 'B', 'P'], (x) => x)).toBe(false);
    expect(hasRunOf3(['B', 'P', 'P', 'P'], (x) => x)).toBe(true);
  });

  it('B 선택지 섞기는 원소를 보존한다', () => {
    expect(shuffle(['P', 'B', 'S', 'G', 'M'], mulberry32(7)).sort()).toEqual(['B', 'G', 'M', 'P', 'S']);
  });
});
