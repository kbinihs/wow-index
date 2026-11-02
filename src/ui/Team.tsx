import { Fragment } from 'preact';
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
  EVEN_LEGEND,
  EVEN_NOTE,
  GAP_LABELS,
  PHASE_NOTE,
  PHASE_QUESTION,
  PHASE_TEXT,
  phaseLegend,
  smallTeamText,
  TEAM_INTRO,
} from '../data/teamText';
import {
  displayName,
  extremes,
  membersByArchetype,
  parseTeamCodes,
  phaseGaps,
  PHASES,
  referenceShape,
  totals,
  typeDistribution,
  type ParsedTeam,
  type PhaseId,
} from '../team';
import { ARCHETYPES, type Archetype } from '../types';
import { TeamPentagon } from './charts/TeamPentagon';
import { announce, Section, useFocusHeading } from './common';
import { Crest } from './Crest';

/** 팀 화면. 붙여 넣은 코드는 이 화면의 메모리에만 있다. */
export function Team() {
  const heading = useFocusHeading('team');
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedTeam | null>(null);
  /** 아무것도 붙여 넣지 않고 불러오기를 눌렀을 때 */
  const [empty, setEmpty] = useState(false);
  const [hide, setHide] = useState(false);
  const [phase, setPhase] = useState<PhaseId | null>(null);

  const members = parsed?.members ?? [];
  const dist = useMemo(() => typeDistribution(members), [members]);
  const types = dist.types;
  const by = useMemo(() => membersByArchetype(members), [members]);
  const total = totals(dist.core, dist.second);
  const ext = extremes(total);
  const gaps = phase ? phaseGaps(total, phase) : null;
  // 'Grower(주 1명 · 보조 1명)'이 괄호 안에서 줄바꿈되지 않게 한 덩어리로 묶는다
  const label = (as: Archetype[]) =>
    as.map((a, i) => (
      <Fragment key={a}>
        {i > 0 && ', '}
        <span class="nowrap">{countLabel(a, dist.core[a], dist.second[a])}</span>
      </Fragment>
    ));
  const names = (idx: number[]) => (idx.length ? idx.map((i) => displayName(members[i], i, hide)).join(', ') : '없음');

  const loadCodes = (e: Event) => {
    e.preventDefault();
    const r = parseTeamCodes(input);
    if (!r.members.length && !r.errors.length && !r.duplicates.length) {
      // 빈 입력이면 이미 불러온 팀은 그대로 두고 안내만 한다
      setEmpty(true);
      return;
    }
    setEmpty(false);
    setParsed(r);
    // 불러온 사람이 없으면 아래 오류 목록(role=alert)이 읽히므로 따로 알리지 않는다
    if (r.members.length) announce(`팀원 ${r.members.length}명을 불러왔습니다.`);
  };

  return (
    <main class="page team">
      <h1 ref={heading} tabIndex={-1}>
        우리 팀 구성
      </h1>
      <p class="lead">{TEAM_INTRO}</p>

      <form class="card team-input no-print" onSubmit={loadCodes}>
        <label for="team-codes">팀 코드나 결과 링크(한 줄에 하나씩)</label>
        <textarea id="team-codes" rows={6} value={input} spellcheck={false} onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)} />
        <button type="submit" class="btn btn-primary">
          불러오기
        </button>
        {empty && (
          <p class="error" role="alert">
            팀 코드나 결과 링크를 한 줄에 하나씩 붙여 넣어 주세요.
          </p>
        )}
        {parsed && (parsed.errors.length > 0 || parsed.duplicates.length > 0) && (
          <ul class="team-problems" role="alert">
            {parsed.errors.map((e) => (
              <li key={e.line}>
                {e.line}번째 줄({e.text}): {DECODE_ERROR_TEXT[e.error]}
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
              <span>별명 숨기기</span>
            </label>
            <ul class="member-list">
              {members.map((m, i) => (
                <li key={i}>
                  <Crest archetype={types[i].core} size={32} />
                  <span class="member-text">
                    <span class="member-name">{displayName(m, i, hide)}</span>{' '}
                    <span class="member-type">{typeName(types[i].core, types[i].second)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={BALANCE_TITLE} id="sec-balance">
            <fieldset class="phase-pick no-print">
              <legend>{PHASE_QUESTION}</legend>
              {([null, ...PHASES.map((p) => p.id)] as (PhaseId | null)[]).map((id) => {
                const t = PHASE_TEXT[id ?? 'none'];
                return (
                  <label key={id ?? 'none'} class={`phase-option${phase === id ? ' is-on' : ''}`}>
                    <input type="radio" name="phase" checked={phase === id} onChange={() => setPhase(id)} />
                    <span class="phase-label">{t.label}</span>
                    <span class="phase-desc">{t.desc}</span>
                  </label>
                );
              })}
            </fieldset>
            <p class="hint">
              {BALANCE_HINT} {phase ? PHASE_NOTE : EVEN_NOTE}
            </p>
            <TeamPentagon
              core={dist.core}
              second={dist.second}
              reference={referenceShape(members.length, phase)}
              referenceLabel={phase ? phaseLegend(phase) : EVEN_LEGEND}
            />
            {gaps ? (
              <dl class="rows">
                <div class="row">
                  <dt>{GAP_LABELS.need}</dt>
                  <dd>{label(gaps.need)}</dd>
                </div>
                {gaps.fewest.length > 0 && (
                  <div class="row">
                    <dt>{GAP_LABELS.fewest}</dt>
                    <dd>{label(gaps.fewest)}</dd>
                  </div>
                )}
                {gaps.some.length > 0 && (
                  <div class="row">
                    <dt>{GAP_LABELS.some}</dt>
                    <dd>{label(gaps.some)}</dd>
                  </div>
                )}
                {gaps.outside.length > 0 && (
                  <div class="row">
                    <dt>{GAP_LABELS.outside}</dt>
                    <dd>{label(gaps.outside)}</dd>
                  </div>
                )}
              </dl>
            ) : ext ? (
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
          관리 화면으로
        </a>
      </div>
    </main>
  );
}
