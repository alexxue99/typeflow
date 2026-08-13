import { useMemo } from "react";
import { EMPTY_ANALYTICS } from "../../lib/defaults";
import type { AnalyticsData } from "../../lib/types";
import { Metric } from "./Metric";

type AnalyticsPageProps = {
  data: AnalyticsData;
  setData: (data: AnalyticsData) => void;
};

export function AnalyticsPage({ data, setData }: AnalyticsPageProps) {
  const letters = useMemo(() => Object.entries(data.letters)
    .sort((a, b) => (b[1].incorrect / b[1].attempts) - (a[1].incorrect / a[1].attempts))
    .slice(0, 5), [data]);
  const bigrams = useMemo(() => Object.entries(data.bigrams)
    .sort((a, b) => (b[1].totalTime / b[1].attempts) - (a[1].totalTime / a[1].attempts))
    .slice(0, 5), [data]);
  const overallWpm = average(data.sessions.map((item) => item.wpm));
  const overallAccuracy = average(data.sessions.map((item) => item.accuracy));

  const reset = () => {
    if (window.confirm("Delete all locally stored typing analytics?")) setData(EMPTY_ANALYTICS);
  };

  return (
    <section className="content-page">
      <div className="analytics-summary"><Metric label="Overall WPM" value={overallWpm || "—"} /><Metric label="Overall accuracy" value={data.sessions.length ? `${overallAccuracy}%` : "—"} /><Metric label="Sessions" value={data.sessions.length} /></div>
      {!data.sessions.length && <div className="empty-state"><h2>There isn’t enough data yet.</h2><p>Complete a few Flow sessions to see your analytics.</p></div>}
      <div className="data-grid">
        <DataCard title="Most error-prone letters" rows={letters.map(([key, stat]) => [key, `${Math.round(stat.incorrect / stat.attempts * 100)}% errors`])} />
        <DataCard title="Slowest bigrams" rows={bigrams.map(([key, stat]) => [key, `${Math.round(stat.totalTime / stat.attempts)} ms`])} />
      </div>
      <div className="table-card"><h2>Recent sessions</h2>{data.sessions.length ? <table><thead><tr><th>Date</th><th>Mode</th><th>WPM</th><th>Accuracy</th></tr></thead><tbody>{data.sessions.map((item) => <tr key={item.id}><td>{new Date(item.date).toLocaleDateString()}</td><td>{item.mode}</td><td>{item.wpm}</td><td>{item.accuracy}%</td></tr>)}</tbody></table> : <p>No saved sessions yet.</p>}</div>
      <button className="mode-settings-apply" onClick={reset}>Reset all analytics data</button>
    </section>
  );
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

function DataCard({ title, rows }: { title: string; rows: string[][] }) {
  return <div className="data-card"><h2>{title}</h2>{rows.length ? rows.map(([key, value], index) => <div className="bar-row" key={key}><strong>{key}</strong><div><span style={{ width: `${95 - index * 12}%` }} /></div><small>{value}</small></div>) : <p>More typing samples are needed.</p>}</div>;
}
