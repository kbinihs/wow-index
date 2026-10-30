import { useMemo, useState } from 'preact/hooks';
import { DECODE_ERROR_TEXT } from '../codec';
import { NAMES, PROFILES, typeName } from '../data/profiles';
import { workName } from '../data/categories';
import {
  BALANCE_NEED_CODES,
  FIT_TEXT,
  NEED_CODES,
  noCoverText,
  noTaskText,
  onlyOneText,
  STAGE_UNSET,
  TASKS_EMPTY,
  TASKS_HINT,
  TEAM_INTRO,
} from '../data/teamText';
import {
  displayName,
  fitOf,
  MAX_TASKS,
  membersByArchetype,
  ownerLoad,
  parseTeamCodes,
  stageBalance,
  STAGES,
  typeDistribution,
  type ParsedTeam,
  type StageId,
  type TeamTask,
} from '../team';
import { ARCHETYPES } from '../types';
import { announce, Section, useFocusHeading } from './common';
import { Crest } from './Crest';

const emptyTask = (): TeamTask => ({ name: '', stage: null, owner: null, note: '' });
const stageOf = (id: StageId | null) => STAGES.find((s) => s.id === id) ?? null;

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
  const balance = useMemo(() => stageBalance(tasks, members), [tasks, members]);
  const load = useMemo(() => ownerLoad(tasks, members.length), [tasks, members]);
  const anyStage = tasks.some((t) => t.stage);
  const name = (i: number) => displayName(members[i], i, hide);
  const names = (idx: number[]) => (idx.length ? idx.map(name).join(', ') : '없음');

  const loadCodes = (e: Event) => {
    e.preventDefault();
    const r = parseTeamCodes(input);
    setParsed(r);
    // 순번이 바뀔 수 있어 담당은 다시 고른다
    setTasks((ts) => ts.map((t) => ({ ...t, owner: null })));
    announce(`팀원 ${r.members.length}명을 불러왔습니다.`);
  };

  const setTask = (i: number, patch: Partial<TeamTask>) => setTasks((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));

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
                  {load[i] > 0 && <span class="chip chip-load">담당 {load[i]}</span>}
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
          {tasks.map((t, i) => {
            const st = stageOf(t.stage);
            const fit = st && t.owner !== null && types[t.owner] ? fitOf(types[t.owner], st.archetype) : null;
            return (
              <li key={i} class="task">
                <label class="sr-only" for={`task-name-${i}`}>
                  업무 {i + 1} 이름
                </label>
                <div class="task-row">
                  <input
                    id={`task-name-${i}`}
                    placeholder={`업무 ${i + 1}`}
                    value={t.name}
                    onInput={(e) => setTask(i, { name: (e.target as HTMLInputElement).value })}
                  />
                  <button
                    type="button"
                    class="btn btn-secondary btn-small no-print"
                    aria-label={`업무 ${i + 1} 지우기`}
                    onClick={() => setTasks((ts) => (ts.length > 1 ? ts.filter((_, j) => j !== i) : [emptyTask()]))}
                  >
                    지우기
                  </button>
                </div>
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
                      {s.label}: {workName(s.archetype)}
                    </option>
                  ))}
                </select>

                {st ? (
                  <div class="task-fit" aria-live="polite">
                    <p class="task-fit-head">
                      <Crest archetype={st.archetype} size={28} />
                      <span>{NAMES[st.archetype]}의 방식이 맞는 팀원</span>
                    </p>
                    <dl class="composition-people">
                      <dt>주 유형</dt>
                      <dd>{members.length ? names(by[st.archetype].core) : NEED_CODES}</dd>
                      <dt>보조 유형</dt>
                      <dd>{members.length ? names(by[st.archetype].second) : NEED_CODES}</dd>
                    </dl>
                  </div>
                ) : (
                  t.name.trim() && <p class="hint task-unset">{STAGE_UNSET}</p>
                )}

                {members.length > 0 && (
                  <div class="task-owner">
                    <label for={`task-owner-${i}`}>담당</label>
                    <select
                      id={`task-owner-${i}`}
                      value={t.owner ?? ''}
                      onChange={(e) => {
                        const v = (e.target as HTMLSelectElement).value;
                        setTask(i, { owner: v === '' ? null : Number(v) });
                      }}
                    >
                      <option value="">정하지 않음</option>
                      {members.map((_, mi) => (
                        <option key={mi} value={mi}>
                          {name(mi)} ({typeName(types[mi].core, types[mi].second)})
                        </option>
                      ))}
                    </select>
                    {fit && <span class={`chip chip-fit-${fit}`}>{FIT_TEXT[fit]}</span>}
                  </div>
                )}

                <label class="sr-only" for={`task-note-${i}`}>
                  업무 {i + 1} 필요한 지원
                </label>
                <input
                  id={`task-note-${i}`}
                  placeholder="필요한 지원(메모)"
                  value={t.note}
                  onInput={(e) => setTask(i, { note: (e.target as HTMLInputElement).value })}
                />
              </li>
            );
          })}
        </ol>
        {tasks.length < MAX_TASKS && (
          <button type="button" class="btn btn-secondary no-print" onClick={() => setTasks((ts) => [...ts, emptyTask()])}>
            업무 추가
          </button>
        )}
      </Section>

      <Section title="업무 단계와 팀 구성" id="sec-coverage">
        {!anyStage ? (
          <p class="hint">{TASKS_EMPTY}</p>
        ) : (
          <>
            <table class="balance">
              <caption class="sr-only">단계별 업무 수와 그 방식을 주·보조 유형으로 가진 팀원 수</caption>
              <thead>
                <tr>
                  <th scope="col">단계</th>
                  <th scope="col">업무</th>
                  <th scope="col">주 유형</th>
                  <th scope="col">보조 유형</th>
                </tr>
              </thead>
              <tbody>
                {balance.map((r) => {
                  const gap = members.length > 0 && r.tasks.length > 0 && r.core.length + r.second.length === 0;
                  return (
                    <tr key={r.stage.id} class={gap ? 'is-gap' : r.tasks.length ? '' : 'is-idle'}>
                      <th scope="row">
                        <span class="balance-stage">
                          <Crest archetype={r.stage.archetype} size={24} />
                          <span>
                            {r.stage.label}
                            <small>{NAMES[r.stage.archetype]}</small>
                          </span>
                        </span>
                      </th>
                      <td>{r.tasks.length}개</td>
                      <td>{members.length ? `${r.core.length}명` : '–'}</td>
                      <td>{members.length ? `${r.second.length}명` : '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {members.length > 0 ? (
              <ul class="signals">
                {balance.flatMap((r) => {
                  const people = [...r.core, ...r.second];
                  const n = r.tasks.length;
                  if (n > 0 && people.length === 0)
                    return [<li key={r.stage.id} class="signal">{noCoverText(r.stage.label, n, r.stage.archetype)}</li>];
                  if (n >= 2 && people.length === 1)
                    return [<li key={r.stage.id} class="signal">{onlyOneText(r.stage.label, n, r.stage.archetype, name(people[0]))}</li>];
                  if (n === 0 && r.core.length > 0)
                    return [<li key={r.stage.id} class="signal">{noTaskText(r.stage.label, r.stage.archetype, r.core.length)}</li>];
                  return [];
                })}
              </ul>
            ) : (
              <p class="hint">{BALANCE_NEED_CODES}</p>
            )}
          </>
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
