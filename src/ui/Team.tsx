import { useMemo, useState } from 'preact/hooks';
import { DECODE_ERROR_TEXT } from '../codec';
import { NAMES, PROFILES, typeName } from '../data/profiles';
import {
  BALANCE_EVEN,
  BALANCE_HINT,
  BALANCE_LEAST,
  BALANCE_MOST,
  BALANCE_TITLE,
  countLabel,
  smallTeamText,
  TEAM_INTRO,
} from '../data/teamText';
import { displayName, extremes, membersByArchetype, parseTeamCodes, totals, typeDistribution, type ParsedTeam } from '../team';
import { ARCHETYPES, type Archetype } from '../types';
import { TeamPentagon } from './charts/TeamPentagon';
import { announce, Section, useFocusHeading } from './common';
import { Crest } from './Crest';

/** 설계서 7장. 붙여 넣은 코드는 이 화면의 메모리에만 있다. */
export function Team() {
  const heading = useFocusHeading('team');
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedTeam | null>(null);
  const [hide, setHide] = useState(false);

  const members = parsed?.members ?? [];
  const dist = useMemo(() => typeDistribution(members), [members]);
  const types = dist.types;
  const by = useMemo(() => membersByArchetype(members), [members]);
  const ext = extremes(totals(dist.core, dist.second));
  const label = (as: Archetype[]) => as.map((a) => countLabel(a, dist.core[a], dist.second[a])).join(', ');
  const names = (idx: number[]) => (idx.length ? idx.map((i) => displayName(members[i], i, hide)).join(', ') : '없음');

  const loadCodes = (e: Event) => {
    e.preventDefault();
    const r = parseTeamCodes(input);
    setParsed(r);
    announce(`팀원 ${r.members.length}명을 불러왔습니다.`);
  };

  return (
    <main class="page team">
      <h1 ref={heading} tabIndex={-1}>
        우리 팀 구성
      </h1>
      <p class="lead">{TEAM_INTRO}</p>

      <form class="card team-input no-print" onSubmit={loadCodes}>
        <label for="team-codes">팀 코드 (한 줄에 한 명)</label>
        <textarea id="team-codes" rows={6} value={input} spellcheck={false} onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)} />
        <button type="submit" class="btn btn-primary">
          불러오기
        </button>
        {parsed && (parsed.errors.length > 0 || parsed.duplicates.length > 0) && (
          <ul class="team-problems" role="alert">
            {parsed.errors.map((e) => (
              <li key={e.line}>
                {e.line}번째 줄: {DECODE_ERROR_TEXT[e.error]}
              </li>
            ))}
            {parsed.duplicates.length > 0 && <li>{parsed.duplicates.join(', ')}번째 줄은 앞의 코드와 같아 뺐습니다.</li>}
          </ul>
        )}
      </form>

      {members.length > 0 && (
        <>
          <Section title={`팀원 ${members.length}명`} id="sec-members">
            <label class="toggle no-print">
              <input type="checkbox" checked={hide} onChange={(e) => setHide((e.target as HTMLInputElement).checked)} />
              <span>이름 숨기기</span>
            </label>
            <ul class="member-list">
              {members.map((m, i) => (
                <li key={i}>
                  <Crest archetype={types[i].core} size={32} />
                  <span class="member-name">{displayName(m, i, hide)}</span>
                  <span class="member-type">{typeName(types[i].core, types[i].second)}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={BALANCE_TITLE} id="sec-balance">
            <p class="hint">{BALANCE_HINT}</p>
            <TeamPentagon core={dist.core} second={dist.second} n={members.length} />
            {ext ? (
              <dl class="rows">
                <div class="row">
                  <dt>{BALANCE_MOST}</dt>
                  <dd>{label(ext.most)}</dd>
                </div>
                <div class="row">
                  <dt>{BALANCE_LEAST}</dt>
                  <dd>{label(ext.least)}</dd>
                </div>
              </dl>
            ) : (
              <p>{BALANCE_EVEN}</p>
            )}
            {members.length < 5 && <p class="hint">{smallTeamText(members.length)}</p>}
          </Section>

          <Section title="다섯 방식별 팀원" id="sec-composition">
            <ul class="composition">
              {ARCHETYPES.map((a) => (
                <li key={a}>
                  <Crest archetype={a} size={40} />
                  <div class="composition-body">
                    <p class="composition-name">
                      {NAMES[a]}
                      <span class="count-chips">
                        <span class="chip chip-core">주 {by[a].core.length}</span>
                        <span class="chip chip-second">보조 {by[a].second.length}</span>
                      </span>
                    </p>
                    <p class="hint composition-line">{PROFILES[a].oneLine}</p>
                    <dl class="composition-people">
                      <dt>주 유형</dt>
                      <dd>{names(by[a].core)}</dd>
                      <dt>보조 유형</dt>
                      <dd>{names(by[a].second)}</dd>
                    </dl>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}

      <div class="actions no-print">
        <button type="button" class="btn btn-secondary" onClick={() => window.print()}>
          인쇄
        </button>
        <a class="btn btn-secondary" href="#/">
          처음 화면으로
        </a>
      </div>
    </main>
  );
}
