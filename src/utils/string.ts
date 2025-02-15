export function trimEnd(str: string, def: string, ...chars: string[]) {
  for (let i = str.length - 1; i >= 0; i--) {
    const c1 = str[i];
    let m = false;
    for (const c2 of chars) {
      if (c1 == c2) {
        m = true;
        break;
      }
    }
    if (!m) {
      return str.substring(0, i + 1);
    }
  }
  return def;
}

const LINE_BREAK_REGEXP = /(?:\r\n)+/g;

export function splitLineBreaks(
  text: string,
  onMatch: (part: string, last: boolean) => void,
) {
  let start: number;
  do {
    start = LINE_BREAK_REGEXP.lastIndex;
    const match = LINE_BREAK_REGEXP.exec(text);
    if (match) {
      onMatch(text.substring(start, match.index), false);
    } else {
      onMatch(text.substring(start), true);
    }
  } while (LINE_BREAK_REGEXP.lastIndex);
}
