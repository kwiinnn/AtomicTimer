/** Minimal RFC-4180 reader: comma or custom delimiter, quoted fields, "" escapes, CRLF/LF, newlines inside quotes. */
export function readCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = 0;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  while (i < src.length) {
    const c = src[i]!;
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
      } else {
        field += c;
      }
      i++;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
      if (c === '\r' && src[i + 1] === '\n') i++;
    } else field += c;
    i++;
  }
  row.push(field);
  if (row.length > 1 || row[0] !== '') rows.push(row);
  return rows;
}

export function writeCsv(rows: (string | number)[][], delimiter = ','): string {
  return rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(delimiter)).join('\r\n') + '\r\n';
}
