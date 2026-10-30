# WoW Index

다섯 가지 업무 방식(Prototyper·Builder·Sweeper·Grower·Maintainer) 가운데 내가 주로 선택하는 두 가지를 주 유형·보조 유형으로 보여 주는 성찰 도구입니다. 서버 없이 브라우저 안에서만 동작하는 단일 HTML 앱입니다.

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm test           # 단위 테스트
npm run build      # dist/index.html 한 파일로 빌드
npx playwright install chromium   # e2e를 처음 돌리기 전에 한 번
npm run e2e        # 빌드 결과를 브라우저로 끝까지 진행해 보는 검사(Playwright)
npm run contrast   # 색 대비 검사
npm run copy-doc   # 결과 문구 문서(docs/result-copy.md) 다시 만들기
```

## 화면

| 주소 | 화면 | 쓰는 사람 |
|---|---|---|
| `#/` | 처음 화면 | 모두 |
| `#/test` | 질문(업무 선호 20문항 + 상황 선택 6개) | 참여자 |
| `#/result/<코드>` | 결과 | 참여자, 받은 사람 |
| `#/team` | 우리 팀 구성(팀 코드 모아 보기) | 진행자 |
| `#/export` | 파일럿 응답 파일 내보내기 | 파일럿 참여자 |
| `#/analysis` | 파일럿 응답 분석(알파, 문항-나머지 상관, CSV) | 진행자 |

## 버전

문항·상황·응답 척도 문구를 바꾸면 아래 세 값을 함께 올릴지 정합니다. 올리지 않으면 문구가 다른 응답이 같은 코드·파일로 섞입니다.

- `src/codec.ts`의 `CODE_VERSION`(팀 코드·결과 링크 형식): 현재 5
- `src/progress.ts`의 `KEY`(이 브라우저에 저장된 진행 기록): 현재 `wa:progress:v5`. 기록 안의 `v`는 저장 형식 버전이라 문구가 바뀌어도 그대로 둡니다.
- `src/pilot.ts`의 `PILOT_VERSION`(파일럿 응답 파일): 현재 3

이전 버전 코드는 열 때 '이전 버전에서 만든 코드' 안내가 나오고, 이전 버전 파일럿 파일은 분석 화면에서 따로 세어 뺍니다.

## 배포(Vercel)

`vercel.json`에 빌드 명령(`npm run build`), 결과 폴더(`dist`), 보안 헤더, 검색 노출 막기(`noindex`)가 들어 있습니다.

- GitHub 저장소를 Vercel에서 Import 하면 이후 push할 때마다 자동으로 배포됩니다.
- 또는 내 컴퓨터에서: `npx vercel deploy dist --prod`

배포 주소는 링크를 아는 사람 누구나 열 수 있습니다. 응답은 서버로 가지 않고 각자의 브라우저에만 남습니다.
