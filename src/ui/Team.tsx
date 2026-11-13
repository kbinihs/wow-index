import { Fragment } from 'preact';
import { useMemo, useRef, useState } from 'preact/hooks';
import { DECODE_ERROR_TEXT, normalizeTeam, TEAM_MAX } from '../codec';
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
  FILE_HINT,
  FILE_LABEL,
  lineLabel,
  LINK_HINT,
  LINK_TITLE,
  PASTE_HINT,
  PASTE_LABEL,
  replacedText,
  skippedText,
  TEAM_ALL_LABEL,
  TEAM_NONE_LABEL,
  TEAM_PICK_QUESTION,
  GAP_LABELS,
  PHASE_NOTE,
  PHASE_QUESTION,
  PHASE_TEXT,
  phaseLegend,
  smallTeamText,
  TEAM_INTRO,
} from '../data/teamText';
import {
  defaultTeamKey,
  displayName,
  extremes,
  filterByTeam,
  membersByArchetype,
  parseTeamSources,
  phaseGaps,
  PHASES,
  referenceShape,
  sameKey,
  teamGroups,
  totals,
  typeDistribution,
  type LineRef,
  type ParsedTeam,
  type PhaseId,
  type TeamKey,
  type TeamSource,
} from '../team';
import { loadJoinedTeam, teamLink } from '../teamLink';
import { ARCHETYPES, type Archetype } from '../types';
import { TeamPentagon } from './charts/TeamPentagon';
import { announce, copyText, Section, shareOrCopy, useFocusHeading } from './common';
import { Crest } from './Crest';

/** 팀 화면. 붙여 넣은 코드는 이 화면의 메모리에만 있다. */
/** home: 맨 아래 돌아가기 링크 이름(응답 화면은 처음 화면, 관리 화면은 관리 화면) */
export function Team({ home = '처음 화면으로' }: { home?: string }) {
  const heading = useFocusHeading('team');
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedTeam | null>(null);
  /** 아무것도 붙여 넣지 않고 불러오기를 눌렀을 때 */
  const [empty, setEmpty] = useState(false);
  const [hide, setHide] = useState(false);
  const [phase, setPhase] = useState<PhaseId | null>(null);
  /** 올린 대화 내보내기 파일들 */
  const [files, setFiles] = useState<TeamSource[]>([]);
  const [teamKey, setTeamKey] = useState<TeamKey>({ kind: 'all' });
  /** 팀 링크를 만들 팀 이름. 이 브라우저가 팀 링크로 들어왔으면 그 이름 */
  const [linkName, setLinkName] = useState(() => loadJoinedTeam() ?? '');
  const [linkStatus, setLinkStatus] = useState('');
  const linkRef = useRef<HTMLInputElement>(null);
  const linkTeam = normalizeTeam(linkName);
  const link = linkTeam ? teamLink(linkTeam) : '';

  const groups = useMemo(() => teamGroups(parsed?.members ?? []), [parsed]);
  const members = useMemo(() => filterByTeam(parsed?.members ?? [], teamKey), [parsed, teamKey]);
  const showTeam = groups.length > 1 && teamKey.kind === 'all';
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

  const load = (text: string, fileSources: TeamSource[]) => {
    const sources: TeamSource[] = [...(text.trim() ? [{ label: null, text }] : []), ...fileSources];
    const r = parseTeamSources(sources);
    if (!r.members.length && !r.errors.length && !r.duplicates.length) {
      // 코드가 하나도 없으면 이미 불러온 팀은 그대로 두고 안내만 한다
      setEmpty(true);
      return;
    }
    setEmpty(false);
    setParsed(r);
    const g = teamGroups(r.members);
    const key = defaultTeamKey(g, [linkTeam, loadJoinedTeam()]);
    setTeamKey(key);
    // 불러온 사람이 없으면 아래 오류 목록(role=alert)이 읽히므로 따로 알리지 않는다
    if (r.members.length) {
      const shown = filterByTeam(r.members, key).length;
      announce(key.kind === 'team' ? `팀원 ${r.members.length}명을 불러와 ${key.team} ${shown}명을 봅니다.` : `팀원 ${r.members.length}명을 불러왔습니다.`);
    }
  };

  const loadCodes = (e: Event) => {
    e.preventDefault();
    load(input, files);
  };

  /** 파일을 고르면 바로 읽어 붙여 넣은 내용과 함께 불러온다 */
  const onFiles = async (e: Event) => {
    const el = e.target as HTMLInputElement;
    const picked = Array.from(el.files ?? []);
    const read = await Promise.all(picked.map(async (f) => ({ label: f.name, text: await f.text() })));
    el.value = '';
    if (!read.length) return;
    setFiles(read);
    load(input, read);
  };

  const copyLink = async () => {
    setLinkStatus((await copyText(link, linkRef.current)) ? '팀 링크를 복사했습니다.' : '복사하지 못했습니다. 칸의 내용을 직접 복사해 주세요.');
  };
  const shareLink = async () => {
    const r = await shareOrCopy(`WoW Index 팀 링크(${linkTeam})\n${link}`, linkRef.current);
    setLinkStatus(
      r === 'copied' ? '팀 링크를 복사했습니다. 팀 대화방에 붙여 넣어 주세요.' : r === 'failed' ? '보내지 못했습니다. 칸의 내용을 직접 복사해 주세요.' : '',
    );
  };

  /** 줄 목록을 글별로 묶어 '3, 5번째 줄' 또는 'chat.txt 3, 5번째 줄'로 */
  const lineList = (refs: LineRef[]) => {
    const by = new Map<string | null, number[]>();
    for (const r of refs) by.set(r.source, [...(by.get(r.source) ?? []), r.line]);
    return [...by.entries()].map(([src, lines]) => lineLabel(src, lines)).join(', ');
  };
  const keyLabel = (k: TeamKey) => (k.kind === 'team' ? k.team : k.kind === 'none' ? TEAM_NONE_LABEL : TEAM_ALL_LABEL);
  const membersTitle = teamKey.kind === 'team' ? `${teamKey.team} · 팀원 ${members.length}명` : `팀원 ${members.length}명`;

  return (
    <main class="page team">
      <h1 ref={heading} tabIndex={-1}>
        우리 팀 구성
      </h1>
      <p class="lead">{TEAM_INTRO}</p>

      <section class="card team-link no-print" aria-labelledby="sec-link">
        <h2 id="sec-link">{LINK_TITLE}</h2>
        <p class="hint">{LINK_HINT}</p>
        <div class="field">
          <label for="team-name">팀 이름({TEAM_MAX}자까지)</label>
          <input
            id="team-name"
            maxLength={TEAM_MAX}
            value={linkName}
            autoComplete="off"
            onInput={(e) => {
              setLinkName((e.target as HTMLInputElement).value);
              setLinkStatus('');
            }}
          />
        </div>
        {linkTeam && (
          <>
            <div class="field">
              <label for="team-link">팀 링크</label>
              <div class="copy-row">
                <input id="team-link" ref={linkRef} readOnly value={link} onFocus={(e) => (e.target as HTMLInputElement).select()} />
                <button type="button" class="btn btn-secondary" onClick={copyLink}>
                  복사
                </button>
              </div>
            </div>
            <button type="button" class="btn btn-secondary" onClick={shareLink}>
              팀 대화방에 보내기
            </button>
          </>
        )}
        <p class="hint" role="status">
          {linkStatus}
        </p>
      </section>

      <form class="card team-input no-print" onSubmit={loadCodes}>
        <label for="team-codes">{PASTE_LABEL}</label>
        <textarea
          id="team-codes"
          rows={6}
          value={input}
          spellcheck={false}
          aria-describedby="team-codes-hint"
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
        <p class="hint" id="team-codes-hint">
          {PASTE_HINT}
        </p>
        <div class="field">
          <label for="team-files">{FILE_LABEL}</label>
          <input id="team-files" type="file" accept=".txt,text/plain,.csv" multiple onChange={onFiles} aria-describedby="team-files-hint" />
          <p class="hint" id="team-files-hint">
            {FILE_HINT}
          </p>
          {files.length > 0 && (
            <p class="file-list">
              올린 파일: {files.map((f) => f.label).join(', ')}{' '}
              <button type="button" class="btn btn-secondary btn-small" onClick={() => setFiles([])}>
                파일 빼기
              </button>
            </p>
          )}
        </div>
        <button type="submit" class="btn btn-primary">
          불러오기
        </button>
        {empty && (
          <p class="error" role="alert">
            팀 코드나 결과 링크를 찾지 못했습니다. 코드가 들어 있는 줄을 붙여 넣거나 대화 내보내기 파일을 올려 주세요.
          </p>
        )}
        {parsed && (parsed.errors.length > 0 || parsed.duplicates.length > 0) && (
          <ul class="team-problems" role="alert">
            {parsed.errors.map((e) => (
              <li key={`${e.source}-${e.line}`}>
                {lineLabel(e.source, e.line)}({e.text}): {DECODE_ERROR_TEXT[e.error]}
              </li>
            ))}
            {parsed.duplicates.length > 0 && <li>{lineList(parsed.duplicates)}은 앞의 코드와 같아 뺐습니다.</li>}
          </ul>
        )}
        {parsed && (parsed.replaced.length > 0 || parsed.skipped > 0) && (
          <ul class="team-notes hint">
            {parsed.replaced.map((r) => (
              <li key={`${r.team}-${r.nick}`}>{replacedText(r.nick, r.count, lineLabel(r.used.source, r.used.line))}</li>
            ))}
            {parsed.skipped > 0 && <li>{skippedText(parsed.skipped)}</li>}
          </ul>
        )}
      </form>

      {groups.length > 1 && (
        <section class="card team-pick-card no-print">
          <fieldset class="phase-pick team-pick">
            <legend>{TEAM_PICK_QUESTION}</legend>
            {[...groups.map((g) => g.key), { kind: 'all' } as TeamKey].map((k) => {
              const n = k.kind === 'all' ? (parsed?.members.length ?? 0) : groups.find((g) => sameKey(g.key, k))!.count;
              const on = sameKey(teamKey, k);
              return (
                <label key={keyLabel(k) + k.kind} class={`phase-option${on ? ' is-on' : ''}`}>
                  <input type="radio" name="team-view" checked={on} onChange={() => setTeamKey(k)} />
                  <span class="phase-label">{keyLabel(k)}</span>
                  <span class="phase-desc">{n}명</span>
                </label>
              );
            })}
          </fieldset>
        </section>
      )}

      {members.length > 0 && (
        <>
          <Section title={membersTitle} id="sec-members">
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
                    {showTeam && <span class="member-team">{m.team ?? TEAM_NONE_LABEL}</span>}{' '}
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
          {home}
        </a>
      </div>
    </main>
  );
}
