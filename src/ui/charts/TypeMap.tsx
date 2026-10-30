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
  partner: '필요한 짝',
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
  const cx = width / 2;
  const cy = R + 40;
  const height = Math.round(cy + R * 0.81 + 80);
  const pos = (i: number) => {
    const t = ((-90 + i * 72) * Math.PI) / 180;
    return { x: cx + R * Math.cos(t), y: cy + R * Math.sin(t) };
  };
  /** 문양 너비. 높이는 1.2배 */
  const crestW = (role: Role) => (role === 'core' ? 54 : 40);
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
    placement.partners.length ? `필요한 짝 ${placement.partners.map((a) => NAMES[a]).join(', ')}` : '필요한 짝 뚜렷하지 않음',
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
            // 맨 위 점은 오른쪽에, 나머지는 아래에 이름을 단다
            const top = n.i === 0;
            const lx = top ? n.x + r + (n.role === 'core' ? 16 : 8) : n.x;
            const ly = top ? n.y - 4 : n.y + r + 17;
            const w = crestW(n.role);
            return (
              <g key={n.a} class={`map-node-${n.role}`}>
                {n.role === 'core' && <circle class="map-halo" cx={n.x} cy={n.y} r={r + 8} />}
                <Crest archetype={n.a} size={w} x={n.x - w / 2} y={n.y - w * 0.6} title={`${NAMES[n.a]}, ${ROLE_LABEL[n.role]}`} />
                <text class="map-name" x={lx} y={ly} text-anchor={top ? 'start' : 'middle'}>
                  {NAMES[n.a]}
                </text>
                <text class="map-role" x={lx} y={ly + 16} text-anchor={top ? 'start' : 'middle'}>
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
          <span class="legend-line legend-partner" /> 필요한 짝
        </li>
      </ul>
    </figure>
  );
}
