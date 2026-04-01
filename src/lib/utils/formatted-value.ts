export function extractFormattedAmount(value: string) {
  const normalized = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMetricNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

export function hasDisplayDate(value: string) {
  return /\d{4}-\d{2}-\d{2}/.test(value);
}
