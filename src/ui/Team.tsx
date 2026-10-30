import { useMemo, useState } from 'preact/hooks';
import { DECODE_ERROR_TEXT } from '../codec';
import { NAMES, PROFILES, typeName } from '../data/profiles';
import { noCoverText, TASKS_EMPTY, TASKS_HINT, TEAM_INTRO } from '../data/teamText';
import {
  displayName,
  MAX_TASKS,
  membersByArchetype,
  parseTeamCodes,
  stageCoverage,
  STAGES,
  typeDistribution,
  type ParsedTeam,
  type StageId,
  type TeamTask,
} from '../team';
import { ARCHETYPES } from '../types';
import { announce, Section, useFocusHeading } from './common';
import { Crest } from './Crest';

const emptyTask = (): TeamTask => ({ name: '', stage: null, note: '' });

/** 설계서 7장. 붙여 넣은 코드와 적은 업무는 이 화면의 메모리에만 있다. */
export function Team() {
  const heading = useFocusHeading('team');
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedTeam | null>(null);
  const [hide, setHide] = useState(false);
  const [tasks, setTasks] = useState<TeamTask[]>([emptyTask(), emptyTask(), emptyTask()]);

  const members = parsed?.members ?? [];
  const types = useMemo(() => typeDistribution(members).types, [members]);
  const by = useMemo(() => membersByArchetype(members), [members]);
  const coverage = useMemo(() => stageCoverage(tasks, members), [tasks, members]);
  const names = (idx: number[]) => (idx.length ? idx.map((i) => displayName(members[i], i, hide)).join(', ') : '없음');

  const load = (e: Event) => {
    e.preventDefault();
    const r = parseTeamCodes(input);
    setParsed(r);
    announce(`팀원 ${r.members.length}명을 불러왔습니다.`);
  };

  const setTask = (i: number, patch: Partial<TeamTask>) => setTasks((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  return (
    <main class="page team">
      <h1 ref={heading} tabIndex={-1}>
        우리 팀 구성
      </h1>
      <p class="lead">{TEAM_INTRO}</p>

      <form class="card team-input no-print" onSubmit={load}>
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

      <Section title="이번 분기 팀 업무" id="sec-tasks">
        <p class="hint">{TASKS_HINT}</p>
        <ol class="task-list">
          {tasks.map((t, i) => (
            <li key={i} class="task">
              <label class="sr-only" for={`task-name-${i}`}>
                업무 {i + 1} 이름
              </label>
              <input
                id={`task-name-${i}`}
                placeholder={`업무 ${i + 1}`}
                value={t.name}
                onInput={(e) => setTask(i, { name: (e.target as HTMLInputElement).value })}
              />
              <div class="task-row">
                <label class="sr-only" for={`task-stage-${i}`}>
                  업무 {i + 1} 단계
                </label>
                <select
                  id={`task-stage-${i}`}
                  value={t.stage ?? ''}
                  onChange={(e) => setTask(i, { stage: ((e.target as HTMLSelectElement).value || null) as StageId | null })}
                >
                  <option value="">단계 고르기</option>
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} ({NAMES[s.archetype]})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  class="btn btn-secondary btn-small no-print"
                  aria-label={`업무 ${i + 1} 지우기`}
                  onClick={() => setTasks((ts) => (ts.length > 1 ? ts.filter((_, j) => j !== i) : [emptyTask()]))}
                >
                  지우기
                </button>
              </div>
              <label class="sr-only" for={`task-note-${i}`}>
                업무 {i + 1} 담당과 필요한 지원
              </label>
              <input
                id={`task-note-${i}`}
                placeholder="이번 분기 담당·필요한 지원"
                value={t.note}
                onInput={(e) => setTask(i, { note: (e.target as HTMLInputElement).value })}
              />
            </li>
          ))}
        </ol>
        {tasks.length < MAX_TASKS && (
          <button type="button" class="btn btn-secondary no-print" onClick={() => setTasks((ts) => [...ts, emptyTask()])}>
            업무 추가
          </button>
        )}
      </Section>

      <Section title="업무 단계와 팀 구성" id="sec-coverage">
        {coverage.length === 0 ? (
          <p class="hint">{TASKS_EMPTY}</p>
        ) : (
          <ul class="coverage">
            {coverage.map((c) => (
              <li key={c.stage.id}>
                <div class="coverage-head">
                  <Crest archetype={c.stage.archetype} size={36} />
                  <p>
                    <strong>{c.stage.label}</strong>
                    <span class="coverage-type">{NAMES[c.stage.archetype]}</span>
                  </p>
                </div>
                <dl class="composition-people">
                  <dt>업무</dt>
                  <dd>{c.tasks.join(', ')}</dd>
                  <dt>주 유형</dt>
                  <dd>{members.length ? names(c.core) : '팀 코드를 불러오면 나옵니다'}</dd>
                  <dt>보조 유형</dt>
                  <dd>{members.length ? names(c.second) : '팀 코드를 불러오면 나옵니다'}</dd>
                </dl>
                {members.length > 0 && c.core.length + c.second.length === 0 && (
                  <p class="signal">{noCoverText(c.stage.label, c.tasks.length, c.stage.archetype)}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

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
