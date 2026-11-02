import { describe, expect, it } from 'vitest';
import { parseAdminHash, parseHash } from '../src/router';

describe('응답 화면과 관리 화면의 주소', () => {
  it('응답 화면에는 팀 화면과 파일럿 분석이 없다', () => {
    expect(parseHash('#/test')).toEqual({ name: 'test' });
    expect(parseHash('#/result/abc')).toEqual({ name: 'result', code: 'abc' });
    expect(parseHash('#/export')).toEqual({ name: 'export' });
    expect(parseHash('#/pilot')).toEqual({ name: 'pilot' });
    expect(parseHash('#/team')).toEqual({ name: 'start' });
    expect(parseHash('#/analysis')).toEqual({ name: 'start' });
    expect(parseHash('')).toEqual({ name: 'start' });
  });

  it('관리 화면은 팀 화면과 파일럿 분석만 연다', () => {
    expect(parseAdminHash('')).toEqual({ name: 'home' });
    expect(parseAdminHash('#/team')).toEqual({ name: 'team' });
    expect(parseAdminHash('#/analysis')).toEqual({ name: 'analysis' });
    expect(parseAdminHash('#/test')).toEqual({ name: 'home' });
    expect(parseAdminHash('#/result/abc')).toEqual({ name: 'home' });
  });
});
