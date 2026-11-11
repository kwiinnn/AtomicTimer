// Web implementation; the native (Capacitor) branch is added in the Capacitor task.

/** Offers `text` to the user as a downloaded file. */
export async function saveTextFile(name: string, text: string, mime: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.append(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/** Local calendar date as YYYY-MM-DD, for file names. */
export function dateStamp(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
