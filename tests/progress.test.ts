import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/data/items';
import { clearProgress, loadProgress, newProgress, placementOf, saveProgress, STEPS, summaryOf, tapRole, type Progress } from '../src/progress';
import { hasRunOf3 } from '../src/shuffle';
import { loadItem, saveItem } from '../src/storage';
import { EX1, EX1_RESPONSES } from './fixtures';

const filled = (over: Partial<Progress> = {}): Progress => ({
  ...newProgress(1),
  a: EX1_RESPONSES,
  b: EX1.b.map((c) => ({ ...c })),
  ...over,
});

describe('Part B 탭 규칙', () => {
  const empty = { best: null, worst: null };
  it('첫 탭 → 가장 맡고 싶음, 다른 항목 → 가장 맡고 싶지 않음', () => {
    const one = tapRole(empty, 'P');
    expect(one).toEqual({ best: 'P', worst: null });
    expect(tapRole(one, 'M')).toEqual({ best: 'P', worst: 'M' });
  });
  it('고른 항목을 다시 탭하면 해제', () => {
    expect(tapRole({ best: 'P', worst: 'M' }, 'P')).toEqual({ best: null, worst: 'M' });
    expect(tapRole({ best: 'P', worst: 'M' }, 'M')).toEqual({ best: 'P', worst: null });
  });
  it('best만 해제된 상태에서 탭 → best', () => {
    expect(tapRole({ best: null, worst: 'M' }, 'S')).toEqual({ best: 'S', worst: 'M' });
  });
  it('둘 다 고른 뒤 세 번째 항목 → 가장 맡고 싶지 않음 교체', () => {
    expect(tapRole({ best: 'P', worst: 'M' }, 'G')).toEqual({ best: 'P', worst: 'G' });
  });
});

describe('진행 상태', () => {
  it('A 5화면 + B 6화면 = 11단계, A 순서는 3연속 없음', () => {
    expect(STEPS).toHaveLength(11);
    const p = newProgress(123);
    const byId = Object.fromEntries(ITEMS.map((i) => [i.id, i.archetype]));
    expect(hasRunOf3(p.aOrder, (id) => byId[id])).toBe(false);
    expect(p.bOrder.every((o) => [...o].sort().join('') === 'BGMPS')).toBe(true);
  });

  it('모두 답하면 예시 1 요약이 나온다', () => {
    expect(summaryOf(filled())).toEqual(EX1);
  });

  it('미응답이면 요약 없음', () => {
    expect(summaryOf(filled({ b: EX1.b.map((c, i) => (i === 5 ? { best: c.best, worst: null } : { ...c })) }))).toBeNull();
  });

  it('동점이면 고르기 전까지 요약 없음, 고르면 그 선택만 남긴다', () => {
    const allThree = Object.fromEntries(Object.keys(EX1_RESPONSES).map((id) => [id, 3]));
    const b = [
      { best: 'P', worst: 'M' },
      { best: 'P', worst: 'M' },
      { best: 'B', worst: 'S' },
      { best: 'B', worst: 'G' },
      { best: 'S', worst: 'M' },
      { best: 'G', worst: 'P' },
    ] as Progress['b'];
    const p = filled({ a: allThree, b });
    expect(placementOf(p)?.pending).toEqual({ slot: 'core', candidates: ['P', 'B'] });
    expect(summaryOf(p)).toBeNull();
    expect(summaryOf({ ...p, picks: { core: 'B', second: 'M' } })?.picks).toEqual({ core: 'B' });
  });
});

// 단위 테스트에는 브라우저 저장소가 없어 storage.ts의 메모리 사본으로 돈다
describe('저장', () => {
  it('깨졌거나 형식이 다른 기록은 읽지 않는다', () => {
    saveItem('wa:progress:v5', '{not json');
    expect(loadProgress()).toBeNull();
    saveItem('wa:progress:v5', JSON.stringify({ v: 3, aOrder: [] }));
    expect(loadProgress()).toBeNull();
    const p = newProgress(5);
    saveProgress(p);
    expect(loadProgress()).toEqual(p);
  });

  it('지우면 이전 버전이 남긴 기록도 함께 지운다', () => {
    saveItem('wa:progress:v3', 'old');
    saveItem('wa:progress:v4', 'old');
    saveProgress(newProgress(5));
    clearProgress();
    expect(loadProgress()).toBeNull();
    expect(loadItem('wa:progress:v3')).toBeNull();
    expect(loadItem('wa:progress:v4')).toBeNull();
  });
});
