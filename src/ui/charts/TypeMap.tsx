import { NAMES } from '../../data/profiles';
import type { Placement } from '../../scoring';
import { ARCHETYPES, type Archetype } from '../../types';
import { Crest } from '../Crest';
import { useWidth } from './svg';

type Role = 'core' | 'second' | 'growth' | 'partner';

export const ROLE_LABEL: Record<Role, string> = {
  core: '주 유형',
  second: '보조 유형',
  growth: '성장 방향',
  partner: '채워 줄 짝',
};

function roleOf(p: Placement, a: Archetype): Role {
  if (a === p.core) return 'core';
  if (a === p.second) return 'second';
  if (p.growth.includes(a)) return 'growth';
  return 'partner';
}

/**
 * 다섯 방식을 원 위에 놓고 주 유형에서 각 자리로 선을 긋는다.
 * 원 위 위치는 배치일 뿐 의미가 없다. 점수를 꼭짓점으로 잇는 레이더 차트가 아니다.
 */
export function TypeMap({ placement }: { placement: Placement }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const R = Math.max(70, Math.min(width / 2 - 56, 112));
  /** 좁은 화면에서는 문양을 줄여 점 사이 선이 너무 짧아지지 않게 한다 */
  const k = Math.min(1, R / 100);
  const cx = width / 2;
  /** 맨 위 점 위에 이름 두 줄이 들어갈 자리 */
  const cy = R + 80;
  const height = Math.round(cy + R * 0.81 + 80);
  const pos = (i: number) => {
    const t = ((-90 + i * 72) * Math.PI) / 180;
    return { x: cx + R * Math.cos(t), y: cy + R * Math.sin(t) };
  };
  /** 문양 너비. 높이는 1.2배 */
  const crestW = (role: Role) => Math.round((role === 'core' ? 54 : 40) * k);
  const radius = (role: Role) => crestW(role) * 0.6;
  const nodes = ARCHETYPES.map((a, i) => ({ a, role: roleOf(placement, a), ...pos(i), i }));
  const core = nodes.find((n) => n.role === 'core')!;

  const line = (to: (typeof nodes)[number]) => {
    const dx = to.x - core.x;
    const dy = to.y - core.y;
    const len = Math.hypot(dx, dy);
    const r0 = radius('core') + 4;
    const r1 = radius(to.role) + (to.role === 'growth' ? 8 : 4);
    return { x1: core.x + (dx / len) * r0, y1: core.y + (dy / len) * r0, x2: to.x - (dx / len) * r1, y2: to.y - (dy / len) * r1 };
  };

  const summary = [
    `주 유형 ${NAMES[placement.core!]}`,
    `보조 유형 ${NAMES[placement.second!]}`,
    `성장 방향 ${placement.growth.map((a) => NAMES[a]).join(', ')}`,
    placement.partners.length ? `채워 줄 짝 ${placement.partners.map((a) => NAMES[a]).join(', ')}` : '채워 줄 짝 뚜렷하지 않음',
  ].join(', ');

  return (
    <figure class="chart type-map">
      <div ref={ref} class="chart-box">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary}>
          <defs>
            <marker id="map-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" class="map-arrow" />
            </marker>
          </defs>
          <circle class="map-ring" cx={cx} cy={cy} r={R} />
          {nodes
            .filter((n) => n.role !== 'core')
            .map((n) => (
              <line key={n.a} class={`map-line map-line-${n.role}`} {...line(n)} marker-end={n.role === 'growth' ? 'url(#map-arrow)' : undefined} />
            ))}
          {nodes.map((n) => {
            const r = radius(n.role);
            // 팀 오각형과 같은 규칙: 위쪽 세 점(P·B·M)은 문양 위에, 아래쪽 두 점(S·G)은 문양 아래에 이름을 단다.
            // 그래야 선이 이름을 가로지르지 않는다. 주 유형은 테두리 원만큼 더 띄운다.
            const halo = n.role === 'core' ? 8 : 0;
            const below = n.i === 2 || n.i === 3;
            // 옆 두 점(B·M)은 이름을 바깥으로 비켜 맨 위 점에서 오는 선과 화살표가 닿지 않게 한다
            const lx = n.i === 1 ? n.x + 12 : n.i === 4 ? n.x - 12 : n.x;
            const ly = below ? n.y + r + halo + 17 : n.y - r - halo - 22;
            const w = crestW(n.role);
            return (
              <g key={n.a} class={`map-node-${n.role}`}>
                {n.role === 'core' && <circle class="map-halo" cx={n.x} cy={n.y} r={r + 8} />}
                <Crest archetype={n.a} size={w} x={n.x - w / 2} y={n.y - w * 0.6} title={`${NAMES[n.a]}, ${ROLE_LABEL[n.role]}`} />
                <text class="map-name" x={lx} y={ly} text-anchor="middle">
                  {NAMES[n.a]}
                </text>
                <text class="map-role" x={lx} y={ly + 16} text-anchor="middle">
                  {ROLE_LABEL[n.role]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <ul class="map-legend" aria-hidden="true">
        <li>
          <span class="legend-line legend-second" /> 보조 유형
        </li>
        <li>
          <span class="legend-line legend-growth" /> 성장 방향
        </li>
        <li>
          <span class="legend-line legend-partner" /> 채워 줄 짝
        </li>
      </ul>
    </figure>
  );
}
