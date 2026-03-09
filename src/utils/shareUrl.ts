export function buildShareUrl(textLines: [string, string, string]): string {
  const params = new URLSearchParams();
  if (textLines[0]) params.set('fn', textLines[0]);
  if (textLines[1]) params.set('ln', textLines[1]);
  if (textLines[2]) params.set('t', textLines[2]);

  const base = window.location.origin + window.location.pathname;
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
