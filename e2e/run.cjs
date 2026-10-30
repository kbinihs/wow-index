// 빌드된 dist/index.html을 file://로 열고, 네트워크를 모두 막은 상태에서 예시 1 응답으로 끝까지 진행한다.
// 사용: npm run build && node e2e/run.cjs [스크린샷 폴더]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FILE = 'file://' + path.resolve(__dirname, '../dist/index.html');
const SHOTS = process.argv[2];

const EX1_A = {
  A01: 5, A02: 5, A03: 4, A04: 4, A05: 3, A06: 3, A07: 3, A08: 3, A09: 5, A10: 4,
  A11: 4, A12: 4, A13: 3, A14: 3, A15: 3, A16: 2, A17: 2, A18: 2, A19: 2, A20: 2,
};
const EX1_B = ['PM', 'PM', 'PM', 'BS', 'SB', 'SG'];
let failures = 0;
const check = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) failures++;
};

async function noHScroll(page, label) {
  const { sw, cw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  check(sw <= cw, `가로 스크롤 없음 — ${label} (scrollWidth ${sw}, clientWidth ${cw})`);
}

async function shot(page, name) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

async function answerA(page, answers, scheme, inspect) {
  for (let p = 0; p < 5; p++) {
    if (inspect && p === 1) {
      // 단계 사이에서 브라우저 뒤로 → 이전 단계(처음 화면으로 나가지 않음)
      await page.goBack();
      const back = await page.waitForSelector('h1:has-text("업무 선호(1/5)")', { timeout: 5000 }).then(() => true, () => false);
      check(back, '브라우저 뒤로 → 이전 단계');
      await page.click('button:has-text("다음")');
      await page.waitForSelector('h1:has-text("업무 선호(2/5)")');
    }
    const ids = await page.$$eval('fieldset.likert input[type=radio][value="1"]', (els) => els.map((e) => e.name));
    for (const id of ids) await page.check(`input[name="${id}"][value="${answers[id]}"]`);
    if (inspect && p === 0) {
      await shot(page, `${scheme}-01-A`);
      await noHScroll(page, 'A');
    }
    if (inspect && p === 2) {
      await page.reload();
      const kept = await page.$$eval('fieldset.likert input:checked', (els) => els.length);
      check(kept === 4, `새로고침 뒤 응답 유지 (A ${p + 1}/5, 체크 ${kept}개)`);
    }
    await page.click('button:has-text("다음")');
  }
}

async function answerB(page, choices, scheme, inspect) {
  for (let i = 0; i < 6; i++) {
    const [best, worst] = choices[i];
    const next = page.locator('.step-nav .btn-primary');
    if (inspect) check(await next.isDisabled(), `B${i + 1} 선택 전 [다음] 비활성`);
    await page.click(`button[data-role="${best}"]`);
    await page.click(`button[data-role="${worst}"]`);
    if (inspect && i === 0) {
      await shot(page, `${scheme}-02-B`);
      await noHScroll(page, 'B');
    }
    await next.click();
  }
}

async function run(colorScheme) {
  let tiedCode = '';
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme, acceptDownloads: true });
  const external = [];
  await context.route(/^https?:/, (route) => {
    external.push(route.request().url());
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  console.log(`\n── ${colorScheme} ──`);
  await page.goto(FILE);
  await shot(page, `${colorScheme}-00-start`);
  await noHScroll(page, '시작');
  await page.click('text=시작하기');

  await answerA(page, EX1_A, colorScheme, true);
  await answerB(page, EX1_B, colorScheme, true);

  // 결과
  await page.waitForSelector('.result-head');
  const text = await page.innerText('main');
  check((await page.innerText('h1')).trim() === 'Prototyper-Sweeper', '유형 Prototyper-Sweeper');
  check(text.includes('선택한 답을 모아 보니 새 아이디어를 내고 만들어 보는 일이 가장 앞섰고, 그다음은 다듬고 덜어 내는 일이었습니다.'), '머리 문장');
  check(!text.includes('상황 선택에서') && !text.includes('끌림') && !text.includes('끌렸'), '상황 선택 섹션 없음, 끌림 표현 없음');
  check(/→ Builder/.test(text), '성장 방향 Builder');
  check(/Grower[\s\S]*Maintainer/.test(await page.innerText('section[aria-labelledby="sec-partners"]')), '채워 줄 짝 Grower, Maintainer');
  check(text.includes('많이 만들어 보고, 안 되는 것은 빨리 걷어 냅니다.'), '조합 풀이 Prototyper-Sweeper');
  check((await page.$('.type-map svg')) !== null, '다섯 방식 지도');
  check(!text.includes('이 브라우저에서 만든 결과가 아니어서'), '내 결과로 표시');
  check((await page.$('#share-link')) === null, 'file://에서는 결과 링크 없이 코드만');
  await noHScroll(page, '결과');
  await shot(page, `${colorScheme}-05-result`);

  // 결과에서 브라우저 뒤로: 끝낸 응답은 그대로 두고, 앞으로 오면 다시 내 결과
  await page.goBack();
  await page.waitForSelector('text=이미 끝낸 응답이 있습니다');
  const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('wa:progress:v5')));
  check(stored !== null && stored.finishedAt !== null, '뒤로 가도 응답 유지');
  await page.goForward();
  await page.waitForSelector('.result-head');
  check(
    (await page.$('#share-code')) !== null && !(await page.innerText('main')).includes('이 브라우저에서 만든 결과가 아니어서'),
    '앞으로 오면 다시 내 결과',
  );

  // 동점: 다른 브라우저에서 A를 모두 3, B 가장 맡고 싶음이 P2·B2
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme });
    await ctx.route(/^https?:/, (r) => r.abort());
    const p3 = await ctx.newPage();
    await p3.goto(FILE);
    await p3.click('text=시작하기');
    await answerA(p3, Object.fromEntries(Object.keys(EX1_A).map((k) => [k, 3])));
    await answerB(p3, ['PM', 'PM', 'BS', 'BG', 'SM', 'GP']);
    await p3.waitForSelector('text=주 유형 고르기');
    const pickText = await p3.innerText('main');
    check(pickText.includes('Prototyper와 Builder의 점수가 같습니다.'), '동점 고르기 화면');
    await noHScroll(p3, '고르기');
    await shot(p3, `${colorScheme}-04-pick`);
    await p3.check('input[name="pick-core"][value="B"]');
    await p3.click('button:has-text("확인")');
    await p3.waitForSelector('.result-head');
    check((await p3.innerText('h1')).trim() === 'Builder-Prototyper', '고른 대로 Builder-Prototyper');
    const t3 = await p3.innerText('main');
    check(
      t3.includes('주 유형은 점수가 같은 방식 가운데 직접 골랐습니다.') &&
        t3.includes('다섯 방식이 대체로 고르게 나와') &&
        !t3.includes('두 방식의 차이는 크지 않았습니다.') &&
        t3.includes('다섯 방식의 차이가 작아 뚜렷하지는 않지만'),
      '동점·고르게 나온 결과의 안내 문장',
    );
    await p3.fill('#share-nick', '나');
    tiedCode = await p3.inputValue('#share-code');
    await ctx.close();
  }

  // 셋이 같을 때: 보조 유형 고르기에서 '이전' → 주 유형 고르기
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme });
    await ctx.route(/^https?:/, (r) => r.abort());
    const p4 = await ctx.newPage();
    await p4.goto(FILE);
    await p4.click('text=시작하기');
    await answerA(p4, Object.fromEntries(Object.keys(EX1_A).map((k) => [k, 3])));
    await answerB(p4, ['PM', 'PM', 'BG', 'BG', 'SM', 'SM']);
    await p4.waitForSelector('text=주 유형 고르기');
    check((await p4.innerText('main')).includes('이 가운데 나와 가장 가깝다고'), '셋이 같을 때 고르기 문장');
    await p4.check('input[name="pick-core"][value="S"]');
    await p4.click('button:has-text("확인")');
    await p4.waitForSelector('text=보조 유형 고르기');
    await p4.click('.step-nav button:has-text("이전")');
    const backToCore = await p4.waitForSelector('h1:has-text("주 유형 고르기")', { timeout: 5000 }).then(() => true, () => false);
    check(backToCore, "보조 유형 고르기에서 '이전' → 주 유형 고르기");
    await p4.check('input[name="pick-core"][value="S"]');
    await p4.click('button:has-text("확인")');
    await p4.waitForSelector('text=보조 유형 고르기');
    await p4.check('input[name="pick-second"][value="B"]');
    await p4.click('button:has-text("확인")');
    await p4.waitForSelector('.result-head');
    check(
      (await p4.innerText('h1')).trim() === 'Sweeper-Builder' &&
        (await p4.innerText('main')).includes('주 유형과 보조 유형은 점수가 같은 방식 가운데 직접 골랐습니다.'),
      '셋이 같을 때 Sweeper-Builder와 직접 고른 안내',
    );
    await ctx.close();
  }

  // 받은 결과로 열기(다른 브라우저 = 저장소 없음)
  const code = await page.inputValue('#share-code');
  const other = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme });
  await other.route(/^https?:/, (r) => r.abort());
  const p2 = await other.newPage();
  await p2.goto(FILE);
  await p2.fill('#code-input', code);
  await p2.click('button:has-text("결과 열기")');
  await p2.waitForSelector('.result-head');
  const t2 = await p2.innerText('main');
  check(
    t2.includes('이 브라우저에서 만든 결과가 아니어서') && t2.includes('Prototyper-Sweeper') && !t2.includes('내 응답 지우기'),
    '받은 코드는 읽기 전용으로 열림',
  );
  await other.close();

  // 팀 화면: 팀 코드 두 개 + 잘못된 줄 + 중복
  await page.goto(FILE + '#/');
  await page.goto(FILE + '#/result/' + code);
  await page.fill('#share-nick', '가');
  const myTeamCode = await page.inputValue('#share-code');
  // 별명을 넣은 내 팀 코드를 처음 화면에서 다시 열어도 내 결과(공유 칸과 별명 유지)
  await page.goto(FILE + '#/');
  await page.fill('#code-input', myTeamCode);
  await page.click('button:has-text("결과 열기")');
  await page.waitForSelector('.result-head');
  check((await page.$('#share-code')) !== null && (await page.inputValue('#share-nick')) === '가', '내 팀 코드로 다시 열어도 내 결과');
  await page.goto(FILE + '#/team');
  await page.fill('#team-codes', [myTeamCode, tiedCode, 'not-a-code!', myTeamCode].join('\n'));
  await page.click('button:has-text("불러오기")');
  const teamText = await page.innerText('main');
  check(teamText.includes('팀원 2명'), '팀원 2명 불러옴');
  check(teamText.includes('3번째 줄(not-a-code!)') && teamText.includes('4번째 줄은 앞의 코드와 같아 뺐습니다.'), '잘못된 줄·중복 안내');
  check(/가\s*Prototyper-Sweeper/.test(teamText) && /나\s*Builder-Prototyper/.test(teamText), '팀원 유형 목록');
  await page.check('text=별명 숨기기');
  const hidden = await page.innerText('section[aria-labelledby="sec-members"]');
  check(hidden.includes('팀원 1') && !/\n가\n/.test(hidden), '별명 숨기기');
  await page.uncheck('text=별명 숨기기');
  const bal = await page.innerText('section[aria-labelledby="sec-balance"]');
  check(/많은 쪽\s*Prototyper\(주 1명 · 보조 1명\)/.test(bal), '가장 많이 들어 있는 방식');
  check(/적은 쪽\s*Grower\(없음\), Maintainer\(없음\)/.test(bal), '가장 적게 들어 있는 방식');
  check(bal.includes('팀원이 2명이라'), '팀원이 적을 때 안내');
  const pent = page.locator('.pentagon .chart-box > svg');
  check((await pent.getAttribute('aria-label')).includes('Prototyper 주 1 · 보조 1'), '오각형 대체 텍스트');
  check((await page.locator('.pent-dot').count()) === 5, '오각형 꼭짓점 5개');
  check((await page.locator('#sec-tasks').count()) === 0, '업무 섹션 없음');
  await page.click('.phase-option:has-text("안정기 사업")');
  const bal2 = await page.innerText('section[aria-labelledby="sec-balance"]');
  check(/이 단계에 필요한 방식\s*Sweeper\(보조 1명\), Grower\(없음\), Maintainer\(없음\)/.test(bal2), '안정기 사업에 필요한 방식');
  check(/약간 필요한 방식\s*Builder\(주 1명\)/.test(bal2), '약간 필요한 방식');
  check(/필요한데 가장 적은 방식\s*Grower\(없음\), Maintainer\(없음\)/.test(bal2), '필요한데 가장 적은 방식');
  check(/이 단계 조합 밖의 방식\s*Prototyper\(주 1명 · 보조 1명\)/.test(bal2), '단계 조합 밖의 방식');
  check(bal2.includes('안정기 사업에 필요한 조합') && bal2.includes('Boris Cherny'), '단계 점선 범례와 출처');
  await noHScroll(page, '팀');
  await shot(page, `${colorScheme}-06-team`);
  await page.fill('#team-codes', '');
  await page.click('button:has-text("불러오기")');
  const emptyText = await page.innerText('main');
  check(emptyText.includes('팀 코드나 결과 링크를 한 줄에 하나씩 붙여 넣어 주세요.') && emptyText.includes('팀원 2명'), '빈 입력은 안내만, 불러온 팀은 그대로');

  // 응답 파일 내보내기 → 분석
  await page.goto(FILE + '#/export');
  check(await page.locator('button:has-text("파일 내려받기")').isDisabled(), '동의 전 내려받기 비활성');
  await page.fill('#pilot-label', 'P07');
  await page.check('text=내 응답 파일을 파일럿 분석에 쓰는 데 동의합니다.');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("파일 내려받기")')]);
  check(/^wow-index-pilot-\d{12}-P07\.json$/.test(download.suggestedFilename()), `파일 이름 ${download.suggestedFilename()}`);
  check((await page.innerText('main')).includes('내려받기를 시작했습니다'), '내려받기 안내가 화면에 보임');
  await page.click('summary:has-text("파일 내용 보기")');
  const exported = JSON.parse(await page.inputValue('textarea[aria-label="응답 파일 내용"]'));
  check(exported.kind === 'wow-index-pilot' && exported.a.A01 === 5 && exported.result.core === 'P' && !('nick' in exported), '응답 파일 내용');
  await noHScroll(page, '내보내기');
  // 다른 참여자의 응답이므로 시작 시각이 다르다(같으면 같은 응답으로 보고 한 번만 센다)
  const exported2 = { ...exported, startedAt: '2026-01-01T00:00:00.000Z', label: 'P08', a: { ...exported.a, A01: 1, A02: 2 } };
  await page.goto(FILE + '#/analysis');
  await page.setInputFiles('#pilot-files', [
    { name: 'a.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) },
    { name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported2)) },
    { name: 'c.json', mimeType: 'application/json', buffer: Buffer.from('{"kind":"x"}') },
  ]);
  await page.waitForSelector('text=참여자 2명');
  const an = await page.innerText('main');
  check(an.includes('형식이 맞지 않아 뺀 것: 1개'), '형식이 다른 파일 안내');
  check(an.includes('문항 분석') && an.includes('상황 선택 분포') && an.includes('크론바흐 알파'), '분석 화면 구성');
  await page.click('summary:has-text("CSV 내용 보기")');
  const csvText = await page.inputValue('textarea[aria-label="CSV 내용"]');
  check(csvText.split('\n').filter(Boolean).length === 3 && csvText.includes('P07') && csvText.includes('P08'), 'CSV 두 줄');
  // 같은 파일을 다시 골라도 한 번만 센다
  await page.setInputFiles('#pilot-files', [{ name: 'a.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) }]);
  await page.waitForSelector('text=이미 읽은 응답과 같아 뺀 것: 1개');
  check((await page.innerText('main')).includes('참여자 2명'), '같은 응답 파일은 한 번만 셈');
  await noHScroll(page, '분석');
  await shot(page, `${colorScheme}-07-analysis`);

  // 잘못된 코드
  await page.goto(FILE + '#/');
  await page.fill('#code-input', 'abc$');
  await page.click('button:has-text("결과 열기")');
  check(await page.isVisible('#code-error'), '잘못된 코드 안내');

  check(errors.length === 0, `페이지 오류 없음 ${errors.join(' | ')}`);
  const nonFont = external.filter((u) => !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u));
  check(nonFont.length === 0, `폰트 외 외부 요청 없음 (폰트 요청 ${external.length - nonFont.length}건, 차단됨)`);
  await browser.close();
}

(async () => {
  await run('light');
  await run('dark');
  console.log(failures ? `\n${failures}개 실패` : '\n모두 통과');
  process.exit(failures ? 1 : 0);
})();
