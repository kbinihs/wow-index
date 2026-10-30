# WoW Index

업무 방식 다섯 유형(Prototyper·Builder·Sweeper·Grower·Maintainer)을 보여 주는 성찰 도구. 서버 없이 브라우저 안에서만 동작하는 단일 HTML 앱입니다.

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm test           # 단위 테스트
npm run build      # dist/index.html 한 파일로 빌드
npm run e2e        # 빌드 결과를 브라우저로 끝까지 진행해 보는 검사(Playwright 필요)
npm run contrast   # 색 대비 검사
npm run copy-doc   # 결과 문구 문서(docs/result-copy.md) 다시 만들기
```

## 배포(Vercel)

`vercel.json`에 빌드 명령(`npm run build`), 결과 폴더(`dist`), 보안 헤더, 검색 노출 막기(`noindex`)가 들어 있습니다.

- GitHub 저장소를 Vercel에서 Import 하면 이후 push할 때마다 자동으로 배포됩니다.
- 또는 내 컴퓨터에서: `npx vercel deploy dist --prod`

배포 주소는 링크를 아는 사람 누구나 열 수 있습니다. 응답은 서버로 가지 않고 각자의 브라우저에만 남습니다.
