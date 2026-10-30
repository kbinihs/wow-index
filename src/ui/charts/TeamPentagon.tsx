import { NAMES } from '../../data/profiles';
import { CYCLE } from '../../team';
import type { Archetype } from '../../types';
import { Crest } from '../Crest';
import { useWidth } from './svg';

type Counts = Record<Archetype, number>;

const CREST = 22;
/** 문양 + 이름 + 인원 한 덩어리의 높이 */
const BLOCK = 61;
/** 꼭짓점과 이름 덩어리 사이 */
const GAP = 12;

/**
 * 팀 안의 다섯 방식. 꼭짓점은 일의 흐름 순서로 두고,
 * 바깥 면은 주·보조 유형 인원, 안쪽 면은 주 유형 인원, 점선은 똑같이 나뉘었을 때.
 */
export function TeamPentagon({ core, second, n }: { core: Counts; second: Counts; n: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  // 옆 꼭짓점의 이름 덩어리(가운데가 꼭짓점에서 26px 바깥, 너비 약 68px)가 화면 안에 들어오는 만큼
  const R = Math.max(70, Math.min(110, (width / 2 - 62) / 0.951));
  const cx = width / 2;
  const cy = R + GAP + BLOCK + 3;
  const height = Math.round(cy + R * 0.809 + GAP + BLOCK + 6);

  const total = (a: Archetype) => core[a] + second[a];
  const maxV = Math.max(1, ...CYCLE.map(total));
  const step = maxV <= 6 ? 1 : Math.ceil(maxV / 4);
  const scaleMax = step * Math.ceil(maxV / step);
  const rings = Array.from({ length: scaleMax / step }, (_, k) => (k + 1) * step);

  const dir = (i: number) => {
    const t = ((-90 + i * 72) * Math.PI) / 180;
    return { x: Math.cos(t), y: Math.sin(t) };
  };
  const pt = (i: number, v: number) => {
    const d = dir(i);
    const r = (v / scaleMax) * R;
    return { x: cx + r * d.x, y: cy + r * d.y };
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const even = (2 * n) / 5;

  /** 이름 덩어리의 가운데 x와 위쪽 y. 위쪽 세 꼭짓점은 꼭짓점 위에, 아래쪽 둘은 아래에 단다 */
  const block = (i: number) => {
    const d = dir(i);
    if (i === 0) return { x: cx, top: cy - R - GAP - BLOCK };
    if (i === 1 || i === 4) return { x: cx + d.x * R + Math.sign(d.x) * 26, top: cy + d.y * R - 6 - BLOCK };
    return { x: cx + d.x * R, top: cy + d.y * R + GAP };
  };
  const countText = (a: Archetype) => (total(a) ? [core[a] && `주 ${core[a]}`, second[a] && `보조 ${second[a]}`].filter(Boolean).join(' · ') : '없음');

  const summary = `다섯 방식의 균형. ${CYCLE.map((a) => `${NAMES[a]} ${countText(a)}`).join(', ')}`;

  return (
    <figure class="chart pentagon">
      <div ref={ref} class="chart-box">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary}>
          {rings.map((v) => (
            <polygon key={v} class="pent-ring" points={poly(CYCLE.map(() => v))} />
          ))}
          {CYCLE.map((a, i) => {
            const p = pt(i, scaleMax);
            return <line key={a} class="pent-spoke" x1={cx} y1={cy} x2={p.x} y2={p.y} />;
          })}
          <g class="pent-data" style={{ transformOrigin: `${cx}px ${cy}px` }}>
            <polygon class="pent-total" points={poly(CYCLE.map(total))} />
            <polygon class="pent-core" points={poly(CYCLE.map((a) => core[a]))} />
            {CYCLE.map((a, i) => {
              const p = pt(i, total(a));
              return <circle key={a} class="pent-dot" cx={p.x} cy={p.y} r={4} />;
            })}
          </g>
          {n > 0 && <polygon class="pent-even" points={poly(CYCLE.map(() => even))} />}
          {CYCLE.map((a, i) => {
            const b = block(i);
            return (
              <g key={a}>
                <Crest archetype={a} size={CREST} x={b.x - CREST / 2} y={b.top} title={NAMES[a]} />
                <text class="pent-name" x={b.x} y={b.top + CREST * 1.2 + 15} text-anchor="middle">
                  {NAMES[a]}
                </text>
                <text class="pent-count" x={b.x} y={b.top + CREST * 1.2 + 31} text-anchor="middle">
                  {countText(a)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ul class="pent-legend" aria-hidden="true">
        <li>
          <span class="swatch swatch-core" /> 주 유형
        </li>
        <li>
          <span class="swatch swatch-total" /> 주·보조 유형
        </li>
        <li>
          <span class="swatch-even" /> 똑같이 나뉘었을 때
        </li>
        <li>회색 선 한 칸 = {step}명</li>
      </ul>
    </figure>
  );
}
