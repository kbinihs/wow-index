// 색 토큰 조합의 WCAG 대비를 계산한다. 사용: node scripts/contrast.mjs
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const C = { orange900: '#e32c13', orange800: '#f14014', orange: '#ff5515', midnight: '#111222', white: '#ffffff', f50: '#f3f2f0', f100: '#e9e7e3', f200: '#dedbd7', f400: '#c9c4bc', g600: '#565461', g700: '#3f3d4c', g800: '#282737', red800: '#b10831', red200: '#e4b2be', o100: '#ffebe1', darkSoft: '#3d2419' };
// [이름, 글자, 바탕, 필요 대비]  — 4.5 일반 글자, 3 큰 글자·그래픽
const pairs = [
  ['라이트 본문', C.midnight, C.f50, 4.5],
  ['라이트 본문(카드)', C.midnight, C.white, 4.5],
  ['라이트 보조 글자 text-2', C.g700, C.f50, 4.5],
  ['라이트 흐린 글자 text-3', C.g600, C.f50, 4.5],
  ['라이트 흐린 글자 text-3(회색 면)', C.g600, C.f100, 4.5],
  ['주요 버튼 글자(오렌지 면 위 흰 글자, 19px 굵게 = 큰 글자)', C.white, C.orange, 3],
  ['배지·단계 표시 글자(Orange 900 면 위 흰 글자, 작은 글자)', C.white, C.orange900, 4.5],
  ['선택 카드 글자(오렌지 옅은 면)', C.midnight, C.o100, 4.5],
  // 제목 글자 WoW의 오렌지 고리는 로고 글자라 대비 기준에서 빠진다. 기본 Orange는 큰 면·장식에만 쓴다.
  ['동그라미 테두리 4·5 Orange 800(라이트 바탕)', C.orange800, C.f50, 3],
  ['동그라미 테두리 4·5 Orange 800(흰 면)', C.orange800, C.white, 3],
  ['오렌지 그래픽(흰 카드)', C.orange, C.white, 3],
  ['오류 글자', C.red800, C.white, 4.5],
  ['동그라미 테두리 1·2(흰 면)', C.g700, C.white, 3],
  ['동그라미 테두리 3(흰 면)', C.g600, C.white, 3],
  ['다크 본문', C.white, C.midnight, 4.5],
  ['다크 본문(카드)', C.white, C.g800, 4.5],
  ['다크 보조 글자 text-2', C.f200, C.g800, 4.5],
  ['다크 흐린 글자 text-3', C.f400, C.g800, 4.5],
  ['다크 흐린 글자 text-3(회색 면)', C.f400, C.g700, 4.5],
  ['다크 선택 카드 글자', C.white, C.darkSoft, 4.5],
  ['다크 어두운 버튼(흰 면 위 Midnight)', C.midnight, C.white, 4.5],
  ['다크 오류 글자', C.red200, C.g800, 4.5],
  ['오렌지 그래픽(다크 바탕)', C.orange, C.midnight, 3],
  ['동그라미 테두리 4·5(다크 카드)', C.orange, C.g800, 3],
  ['다크 제목 흰 글자가 오렌지 원호 위에 놓일 때(큰 글자)', C.white, C.orange, 3],
];
let fail = 0;
for (const [name, fg, bg, need] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= need;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)} (기준 ${need})  ${name}`);
}
process.exit(fail ? 1 : 0);
