/**
 * localStorage를 감싼 임시 저장소. 접근이 막히거나(사생활 보호 모드, file:// 제한)
 * 용량이 차면 메모리에만 둔다. 메모리 사본을 먼저 보므로 쓰기에 실패해도 읽기는 일관된다.
 */
const memory = new Map<string, string>();

export function loadItem(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveItem(key: string, value: string): void {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 메모리 사본으로 계속 진행
  }
}

export function removeItem(key: string): void {
  memory.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 지울 것이 없거나 접근 불가
  }
}
