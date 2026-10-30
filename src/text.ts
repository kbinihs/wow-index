/** 한국어 조사·나열 도우미 */

function hasFinalConsonant(word: string): boolean {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  // 숫자·기호로 끝나면 받침 판단을 하지 않고 받침 없음으로 둔다
  return false;
}

/** josa('일', '을', '를') → '일을' */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  return word + (hasFinalConsonant(word) ? withFinal : withoutFinal);
}

/** ['가','나','다'] → '가, 나와 다' (마지막 연결 조사는 받침에 맞춤) */
export function joinAnd(words: readonly string[]): string {
  if (words.length <= 1) return words.join('');
  const head = words.slice(0, -1);
  const last = words[words.length - 1];
  const lead = head.length > 1 ? head.slice(0, -1).join(', ') + ', ' : '';
  return lead + josa(head[head.length - 1], '과', '와') + ' ' + last;
}
