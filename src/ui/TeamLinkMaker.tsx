import { useRef, useState } from 'preact/hooks';
import { normalizeTeam, TEAM_MAX } from '../codec';
import { LINK_BUTTON, LINK_HINT } from '../data/teamText';
import { loadJoinedTeam, loadMadeTeam, saveMadeTeam, teamLink } from '../teamLink';
import { copyText, shareOrCopy } from './common';

/**
 * 팀장이 팀원에게 보낼 팀 링크를 만드는 작은 버튼. 누르면 팀 이름 칸과 링크가 펼쳐진다.
 * 처음 화면과 관리 화면에 둔다. 링크는 늘 응답 화면을 가리킨다.
 */
export function TeamLinkMaker() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => loadMadeTeam() ?? loadJoinedTeam() ?? '');
  const [status, setStatus] = useState('');
  const linkRef = useRef<HTMLInputElement>(null);
  const team = normalizeTeam(name);
  const link = team ? teamLink(team) : '';

  const copy = async () => {
    setStatus((await copyText(link, linkRef.current)) ? '팀 링크를 복사했습니다.' : '복사하지 못했습니다. 칸의 내용을 직접 복사해 주세요.');
  };
  const share = async () => {
    const r = await shareOrCopy(`WoW Index 팀 링크(${team})\n${link}`, linkRef.current);
    setStatus(r === 'copied' ? '팀 링크를 복사했습니다. 팀 대화방에 붙여 넣어 주세요.' : r === 'failed' ? '보내지 못했습니다. 칸의 내용을 직접 복사해 주세요.' : '');
  };

  return (
    <div class="team-link-maker no-print">
      <button
        type="button"
        class="btn btn-secondary btn-small"
        aria-expanded={open}
        aria-controls="team-link-panel"
        onClick={() => setOpen((o) => !o)}
      >
        {LINK_BUTTON}
      </button>
      {open && (
        <div class="card team-link" id="team-link-panel">
          <p class="hint">{LINK_HINT}</p>
          <div class="field">
            <label for="team-name">팀 이름({TEAM_MAX}자까지)</label>
            <input
              id="team-name"
              maxLength={TEAM_MAX}
              value={name}
              autoComplete="off"
              onInput={(e) => {
                const v = (e.target as HTMLInputElement).value;
                setName(v);
                saveMadeTeam(v);
                setStatus('');
              }}
            />
          </div>
          {team && (
            <>
              <div class="field">
                <label for="team-link">팀 링크</label>
                <div class="copy-row">
                  <input id="team-link" ref={linkRef} readOnly value={link} onFocus={(e) => (e.target as HTMLInputElement).select()} />
                  <button type="button" class="btn btn-secondary btn-small" onClick={copy}>
                    복사
                  </button>
                </div>
              </div>
              <button type="button" class="btn btn-secondary team-link-share" onClick={share}>
                팀 대화방에 보내기
              </button>
            </>
          )}
          <p class="hint" role="status">
            {status}
          </p>
        </div>
      )}
    </div>
  );
}
