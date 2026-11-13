// 색 토큰 조합의 WCAG 대비를 계산한다. 사용: node scripts/contrast.mjs
// 색 값은 src/styles/tokens.css와 같게 둔다.
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const C = {
  navy: '#213448', steel: '#547792', sky: '#94b4c1', sand: '#eae0cf', white: '#ffffff',
  sand50: '#f6f1e9', sand100: '#f0e9dd', sky100: '#e1eaee', steel700: '#4b6b85', navy700: '#334b62',
  sand800: '#69655d', sand600: '#8c867c', sand450: '#a4a4a0', navy900: '#162331', navy600: '#2a4055', navy500: '#354f66', red800: '#b10831', red200: '#e4b2be',
};
// [이름, 글자, 바탕, 필요 대비]  — 4.5 일반 글자, 3 큰 글자·그래픽
const pairs = [
  ['라이트 본문', C.navy, C.sand50, 4.5],
  ['라이트 본문(카드)', C.navy, C.white, 4.5],
  ['라이트 보조 글자 text-2', C.navy700, C.sand50, 4.5],
  ['라이트 보조 글자 text-2(회색 면)', C.navy700, C.sand100, 4.5],
  ['라이트 흐린 글자 text-3', C.steel700, C.sand50, 4.5],
  ['라이트 흐린 글자 text-3(카드)', C.steel700, C.white, 4.5],
  ['라이트 흐린 글자 text-3(회색 면)', C.steel700, C.sand100, 4.5],
  ['주요 버튼 글자(Navy 면 위 흰 글자)', C.white, C.navy, 4.5],
  ['배지·칩 글자(Steel 700 면 위 흰 글자, 작은 글자)', C.white, C.steel700, 4.5],
  ['선택 카드 글자(Sky 옅은 면)', C.navy, C.sky100, 4.5],
  ['알림 글자(Sand 면)', C.navy, C.sand100, 4.5],
  ['강조 그래픽 Steel(흰 카드): 동그라미 4·5, 진행 막대, 선택 테두리, 오각형', C.steel, C.white, 3],
  ['강조 그래픽 Steel(바탕)', C.steel, C.sand50, 3],
  ['선택 테두리 Steel(Sky 옅은 면)', C.steel, C.sky100, 3],
  ['동그라미 테두리 1·2 따뜻한 회색(흰 면)', C.sand800, C.white, 3],
  ['동그라미 테두리 1·2 따뜻한 회색(바탕)', C.sand800, C.sand50, 3],
  ['동그라미 테두리 3 옅은 회색(흰 면)', C.sand600, C.white, 3],
  ['동그라미 테두리 3 옅은 회색(바탕)', C.sand600, C.sand50, 3],
  ['다크 동그라미 테두리 1·2 Sand(카드)', C.sand, C.navy, 3],
  ['다크 동그라미 테두리 3(카드)', C.sand450, C.navy, 3],
  ['다크 동그라미 테두리 3(바탕)', C.sand450, C.navy900, 3],
  ['오류 글자', C.red800, C.white, 4.5],
  ['문양 상징 Navy(Sand 바탕)', C.navy, C.sand, 3],
  ['문양 상징 Navy(Sky 분할)', C.navy, C.sky, 3],
  ['다크 본문', C.sand50, C.navy900, 4.5],
  ['다크 본문(카드)', C.sand50, C.navy, 4.5],
  ['다크 보조 글자 text-2(카드)', C.sand, C.navy, 4.5],
  ['다크 보조 글자 text-2(회색 면)', C.sand, C.navy600, 4.5],
  ['다크 흐린 글자 text-3(카드)', C.sky, C.navy, 4.5],
  ['다크 흐린 글자 text-3(회색 면)', C.sky, C.navy600, 4.5],
  ['다크 흐린 글자 text-3(바탕)', C.sky, C.navy900, 4.5],
  ['다크 주요 버튼·배지(Sky 면 위 Navy 글자)', C.navy, C.sky, 4.5],
  ['다크 어두운 배지(Sand 면 위 Navy 글자)', C.navy, C.sand, 4.5],
  ['다크 선택 카드 글자', C.sand50, C.navy500, 4.5],
  ['다크 알림 글자', C.sand50, C.navy600, 4.5],
  ['다크 강조 그래픽 Sky(카드)', C.sky, C.navy, 3],
  ['다크 강조 그래픽 Sky(선택 면)', C.sky, C.navy500, 3],
  ['다크 오류 글자', C.red200, C.navy, 4.5],
  ['다크 초점 테두리 Sand(바탕)', C.sand, C.navy900, 3],
  ['입력 칸 테두리(흰 카드)', C.sand600, C.white, 3],
  ['다크 입력 칸 테두리(카드)', C.sand600, C.navy, 3],
  ['오류 띠(알림 면)', C.red800, C.sand100, 3],
  ['다크 오류 띠(알림 면)', C.red200, C.navy600, 3],
];
let fail = 0;
for (const [name, fg, bg, need] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= need;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)} (기준 ${need})  ${name}`);
}
process.exit(fail ? 1 : 0);
