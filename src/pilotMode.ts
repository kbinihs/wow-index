import { loadItem, saveItem } from './storage';

/**
 * 파일럿 참여 표시. 진행자가 나눠 준 참여 링크(#/pilot)로 들어온 브라우저에서만 켜지고,
 * 켜져 있을 때만 결과 화면에 '응답 파일 내보내기'가 보인다.
 */
const KEY = 'wa:pilot';

export const isPilotMode = (): boolean => loadItem(KEY) === '1';
export const startPilotMode = (): void => saveItem(KEY, '1');
