export type Rng = () => number;

/** 시드 난수. 진행 저장에 시드만 남기면 같은 순서를 다시 만들 수 있다. */
export function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 같은 키가 3개 이상 연속되는 곳이 있는가 */
export function hasRunOf3<T>(arr: readonly T[], key: (t: T) => string): boolean {
  for (let i = 2; i < arr.length; i++) {
    const k = key(arr[i]);
    if (k === key(arr[i - 1]) && k === key(arr[i - 2])) return true;
  }
  return false;
}

/** A 문항 섞기: 같은 원형 3연속 금지(화면 경계를 넘어서도 적용) */
export function shuffleNoRun3<T>(arr: readonly T[], key: (t: T) => string, rng: Rng): T[] {
  // 무작위 순열이 조건을 만족할 확률이 약 70%라 몇 번 안에 끝난다
  for (let tries = 0; tries < 10000; tries++) {
    const out = shuffle(arr, rng);
    if (!hasRunOf3(out, key)) return out;
  }
  throw new Error('조건을 만족하는 순서를 찾지 못함');
}
