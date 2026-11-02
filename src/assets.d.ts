/** 이미지 파일을 가져오면 빌드가 data: 주소 문자열로 바꿔 넣는다(CSP img-src data:) */
declare module '*.webp' {
  const src: string;
  export default src;
}
