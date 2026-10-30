// 결과 문구를 코드(src/data/profiles.ts)에서 바로 뽑아 docs/result-copy.md로 쓴다. 화면 문구와 문서가 어긋나지 않게 한다.
// 사용: npm run copy-doc
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';

const out = await build({ entryPoints: ['src/data/profiles.ts'], bundle: true, format: 'esm', write: false, platform: 'node' });
const mod = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
const { NAMES, PROFILES, PROFILE_LABELS, COMBOS, GROWTH, GROWTH_LEAD, PARTNER, PARTNER_LEAD, PARTNER_NONE, CLOSE_PAIR_TEXT, FLAT_TEXT, leadText, pickText } = mod;
const A = ['P', 'B', 'S', 'G', 'M'];
const cell = (v) => (Array.isArray(v) ? v.join('<br>') : v);

const lines = [
  '# 결과 문구',
  '',
  '이 문서는 `npm run copy-doc`으로 코드에서 만듭니다. 문구를 고칠 때는 `src/data/profiles.ts`를 고치고 다시 만드세요.',
  '',
  '## 머리 문장',
  '',
  `- 예: ${leadText('P', 'S')}`,
  `- 1·2위 차이가 0.5 미만이면 덧붙임: ${CLOSE_PAIR_TEXT}`,
  `- 다섯 방식 차이가 0.5 미만이면 덧붙임: ${FLAT_TEXT}`,
  `- 동점일 때: ${pickText(['P', 'B'])}`,
  '',
  '## 주 유형',
  '',
];
for (const a of A) {
  lines.push(`### ${NAMES[a]}`, '', '| 항목 | 내용 |', '|---|---|');
  for (const [k, label] of Object.entries(PROFILE_LABELS)) if (PROFILES[a][k]) lines.push(`| ${label} | ${cell(PROFILES[a][k])} |`);
  lines.push('');
}
lines.push('## 주 유형-보조 유형', '', '| 조합 | 이렇게 일합니다 | 주의할 점 |', '|---|---|---|');
for (const c of A) for (const s of A) if (c !== s) lines.push(`| ${NAMES[c]}-${NAMES[s]} | ${COMBOS[`${c}-${s}`].how} | ${COMBOS[`${c}-${s}`].caution} |`);
lines.push('', '## 성장 방향 (3위)', '', GROWTH_LEAD, '', '| 3위 | 문장 |', '|---|---|');
for (const a of A) lines.push(`| ${NAMES[a]} | ${GROWTH[a]} |`);
lines.push('', '## 필요한 짝 (4·5위)', '', PARTNER_LEAD, '', `짝이 없을 때: ${PARTNER_NONE}`, '', `| 주 유형 ↓ / 짝 → | ${A.map((a) => NAMES[a]).join(' | ')} |`, `|---|${A.map(() => '---').join('|')}|`);
for (const c of A) lines.push(`| ${NAMES[c]} | ${A.map((s) => (c === s ? '—' : PARTNER[c][s])).join(' | ')} |`);
writeFileSync('docs/result-copy.md', lines.join('\n') + '\n');
console.log('docs/result-copy.md 생성');
