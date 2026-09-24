/** Save a string as a file in the browser. */
export function downloadFile(name: string, content: string, type = "application/json"): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportStats(data: unknown): void {
  const date = new Date().toISOString().slice(0, 10);
  downloadFile(`inktype-${date}.json`, JSON.stringify(data, null, 2));
}
