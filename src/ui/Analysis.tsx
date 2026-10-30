import { useMemo, useRef, useState } from 'preact/hooks';
import { ITEMS } from '../data/items';
import { NAMES } from '../data/profiles';
import { coreCounts, itemAnalysis, median, parsePilotText, scenarioCounts, toCsv, type PilotRecord } from '../pilot';
import { ARCHETYPES } from '../types';
import { announce, copyText, downloadText, Section, useFocusHeading } from './common';
import { Crest } from './Crest';

const ITEM = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
/** 나머지 문항과의 상관이 이보다 낮으면 다시 볼 만한 문항으로 표시 */
const LOW_REST = 0.3;

const fmt = (x: number | null, digits = 2) => (x === null ? '–' : x.toFixed(digits));
function minutes(sec: number | null): string {
  if (sec === null) return '–';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}분 ${s}초` : `${s}초`;
}

/** 진행자가 참여자들의 응답 파일을 모아 문항을 살펴본다. 파일은 이 화면에서만 읽는다. */
export function Analysis() {
  const heading = useFocusHeading('analysis');
  const [records, setRecords] = useState<PilotRecord[]>([]);
  const [bad, setBad] = useState(0);
  const [paste, setPaste] = useState('');
  const csvRef = useRef<HTMLTextAreaElement>(null);

  const add = (texts: string[]) => {
    let got: PilotRecord[] = [];
    let skipped = 0;
    for (const t of texts) {
      const r = parsePilotText(t);
      got = got.concat(r.records);
      skipped += r.bad;
    }
    setRecords((rs) => [...rs, ...got]);
    setBad((b) => b + skipped);
    announce(`응답 ${got.length}개를 읽었습니다.${skipped ? ` 형식이 맞지 않아 뺀 것 ${skipped}개.` : ''}`);
  };

  const onFiles = async (e: Event) => {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    add(await Promise.all(files.map((f) => f.text())));
    (e.target as HTMLInputElement).value = '';
  };

  const stats = useMemo(() => itemAnalysis(records), [records]);
  const cores = useMemo(() => coreCounts(records), [records]);
  const scenarios = useMemo(() => scenarioCounts(records), [records]);
  const csv = useMemo(() => toCsv(records), [records]);
  const times = {
    A: median(records.map((r) => r.seconds.A)),
    B: median(records.map((r) => r.seconds.B)),
    total: median(records.map((r) => r.seconds.A + r.seconds.B + r.seconds.pick)),
  };

  return (
    <main class="page analysis">
      <h1 ref={heading} tabIndex={-1}>
        파일럿 응답 분석
      </h1>
      <p class="lead">참여자들이 보낸 응답 파일(.json)을 한꺼번에 고르거나 파일 내용을 붙여 넣으세요. 파일은 이 화면에서만 읽고 어디에도 보내지 않습니다.</p>

      <div class="card no-print">
        <div class="field">
          <label for="pilot-files">응답 파일 고르기</label>
          <input id="pilot-files" type="file" accept=".json,application/json" multiple onChange={onFiles} />
        </div>
        <div class="field">
          <label for="pilot-paste">또는 파일 내용 붙여 넣기</label>
          <textarea id="pilot-paste" rows={4} value={paste} spellcheck={false} onInput={(e) => setPaste((e.target as HTMLTextAreaElement).value)} />
        </div>
        <div class="actions">
          <button
            type="button"
            class="btn btn-secondary"
            disabled={!paste.trim()}
            onClick={() => {
              add([paste]);
              setPaste('');
            }}
          >
            붙여 넣은 내용 읽기
          </button>
          {records.length > 0 && (
            <button
              type="button"
              class="btn btn-secondary"
              onClick={() => {
                setRecords([]);
                setBad(0);
              }}
            >
              모두 비우기
            </button>
          )}
        </div>
        {bad > 0 && <p class="error">형식이 맞지 않아 뺀 것: {bad}개</p>}
      </div>

      {records.length > 0 && (
        <>
          <Section title={`참여자 ${records.length}명`} id="sec-overview">
            <p class="hint">참여자가 적을 때는 수치가 크게 흔들리니 참고로만 보는 것이 좋습니다.</p>
            <ul class="core-counts">
              {ARCHETYPES.map((a) => (
                <li key={a}>
                  <Crest archetype={a} size={32} />
                  <span>{NAMES[a]}</span>
                  <strong>{cores[a]}명</strong>
                </li>
              ))}
            </ul>
            <dl class="composition-people">
              <dt>업무 선호</dt>
              <dd>{minutes(times.A)}</dd>
              <dt>상황 선택</dt>
              <dd>{minutes(times.B)}</dd>
              <dt>전체</dt>
              <dd>{minutes(times.total)}</dd>
            </dl>
            <p class="hint">걸린 시간은 가운데 값(중앙값)입니다. 화면을 띄워 두고 자리를 비운 시간도 들어갑니다.</p>
          </Section>

          <Section title="문항 분석" id="sec-items">
            <p class="hint">
              '나머지 문항과의 상관'은 같은 방식의 다른 세 문항과 함께 움직이는 정도입니다. {LOW_REST}보다 낮으면 다른 문항과 따로 움직인다는 뜻이라 문구를 다시 볼 만합니다.
            </p>
            {stats.map((s) => (
              <div key={s.archetype} class="item-block">
                <h3 class="item-head">
                  <Crest archetype={s.archetype} size={28} />
                  {NAMES[s.archetype]}
                  <span class="hint">크론바흐 알파 {fmt(s.alpha)}</span>
                </h3>
                <div class="table-wrap">
                  <table class="stat-table">
                    <thead>
                      <tr>
                        <th scope="col">문항</th>
                        <th scope="col">평균</th>
                        <th scope="col">표준편차</th>
                        <th scope="col">나머지 문항과의 상관</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.items.map((it) => (
                        <tr key={it.id}>
                          <th scope="row">
                            <span class="item-id">{it.id}</span> <span class="item-facet">{ITEM[it.id].facet}</span> {ITEM[it.id].text}
                          </th>
                          <td>{fmt(it.mean)}</td>
                          <td>{fmt(it.sd)}</td>
                          <td>
                            {fmt(it.rest)}
                            {it.rest !== null && it.rest < LOW_REST && <span class="chip chip-low">낮음</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </Section>

          <Section title="상황 선택 분포" id="sec-scenarios">
            <p class="hint">한 역할에 '가장 맡고 싶음'이 몰리면 그 선택지가 정답처럼 보였을 수 있습니다.</p>
            <div class="table-wrap">
              <table class="stat-table">
                <thead>
                  <tr>
                    <th scope="col">상황</th>
                    <th scope="col">구분</th>
                    {ARCHETYPES.map((a) => (
                      <th key={a} scope="col">
                        {NAMES[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scenarios.flatMap((sc) => [
                    <tr key={`${sc.id}-best`}>
                      <th scope="row" rowSpan={2}>
                        {sc.id}
                      </th>
                      <td>가장 맡고 싶음</td>
                      {ARCHETYPES.map((a) => (
                        <td key={a}>{sc.best[a]}</td>
                      ))}
                    </tr>,
                    <tr key={`${sc.id}-worst`}>
                      <td>가장 맡고 싶지 않음</td>
                      {ARCHETYPES.map((a) => (
                        <td key={a}>{sc.worst[a]}</td>
                      ))}
                    </tr>,
                  ])}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="CSV로 받기" id="sec-csv">
            <p class="hint">참여자 한 명이 한 줄입니다. 엑셀이나 통계 프로그램에서 열 수 있습니다.</p>
            <div class="actions no-print">
              <button
                type="button"
                class="btn btn-primary"
                onClick={() =>
                  announce(downloadText('wow-index-pilot.csv', csv, 'text/csv') ? 'CSV를 내려받았습니다.' : 'CSV를 내려받지 못했습니다. 아래 내용을 복사해 쓰세요.')
                }
              >
                CSV 내려받기
              </button>
            </div>
            <details class="table-view">
              <summary>CSV 내용 보기(내려받기가 안 될 때)</summary>
              <textarea ref={csvRef} readOnly rows={6} value={csv} aria-label="CSV 내용" />
              <button
                type="button"
                class="btn btn-secondary btn-small"
                onClick={async () => announce((await copyText(csv, csvRef.current)) ? 'CSV를 복사했습니다.' : '복사하지 못했습니다. 칸의 내용을 직접 복사해 주세요.')}
              >
                내용 복사
              </button>
            </details>
          </Section>
        </>
      )}

      <p>
        <a href="#/" class="text-link">
          처음 화면으로
        </a>
      </p>
    </main>
  );
}
