import { normalizeTeam } from './codec';
import { loadItem, removeItem, saveItem } from './storage';

/**
 * 팀 링크(#/t/팀이름). 팀장이 팀 화면에서 만들어 팀원에게 보낸다.
 * 이 링크로 들어온 브라우저는 팀 이름을 기억해 두고, 결과를 공유할 때 결과 코드에 팀 이름을 붙인다.
 * 서버에 아무것도 보내지 않는다. 팀장은 팀원들이 대화방에 보낸 코드를 한꺼번에 붙여 넣어 모은다.
 */
const KEY = 'wa:team';

export const loadJoinedTeam = (): string | null => normalizeTeam(loadItem(KEY));

export function saveJoinedTeam(team: string | null): void {
  const t = normalizeTeam(team);
  if (t) saveItem(KEY, t);
  else removeItem(KEY);
}

export const teamLinkHash = (team: string): string => `#/t/${encodeURIComponent(team)}`;

/** '#/t/…' 뒤의 팀 이름. 읽을 수 없으면 null */
export function teamFromPath(encoded: string): string | null {
  try {
    return normalizeTeam(decodeURIComponent(encoded));
  } catch {
    return null;
  }
}

/** 응답 화면 주소. 배포에서는 '/', 파일로 열었을 때는 같은 폴더의 index.html(관리 화면에서도 응답 화면을 가리킨다) */
export function publicBase(): string {
  const dir = new URL('./', window.location.href).href;
  return window.location.protocol === 'file:' ? `${dir}index.html` : dir;
}

export const teamLink = (team: string): string => `${publicBase()}${teamLinkHash(team)}`;
