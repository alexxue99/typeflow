export function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className={`metric${label ? "" : " metric-value-only"}`}><strong>{value}</strong>{label && <span>{label}</span>}</div>;
}
