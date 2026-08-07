"use client";

import { AREA_STATIONS, formsForArea } from "@/lib/mock-checklist";
import { BrowserChecklistRecord, CHECKLIST_STORAGE_PREFIX } from "@/lib/mock-session";
import { ArrowLeft, CheckCircle2, Clock3, Eye, Factory, FileDown, FilterX, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type QueueTab = "queue" | "all" | "checked";

function readBrowserRecords() {
  const records: BrowserChecklistRecord[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(CHECKLIST_STORAGE_PREFIX)) continue;
    try {
      const record = JSON.parse(window.localStorage.getItem(key) ?? "") as BrowserChecklistRecord;
      if (record.id && record.line && record.submissionStatus === "submitted" && record.approvalStatus === "checked") records.push(record);
    } catch {
      // Ignore malformed mock entries without affecting other browser data.
    }
  }
  return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export default function ChecklistDashboard() {
  const params = useSearchParams();
  const initialLine = params.get("line") ?? "";
  const [records, setRecords] = useState<BrowserChecklistRecord[]>([]);
  const [tab, setTab] = useState<QueueTab>("all");
  const [search, setSearch] = useState("");
  const [line, setLine] = useState(initialLine);
  const [area, setArea] = useState("");
  const [month, setMonth] = useState("");
  const [selected, setSelected] = useState<BrowserChecklistRecord | null>(null);

  const refresh = useCallback(() => setRecords(readBrowserRecords()), []);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const lines = useMemo(() => [...new Set(records.map((record) => record.line))], [records]);
  const queueCount = records.filter((record) => record.submissionStatus === "submitted" && record.approvalStatus === "pending").length;
  const checkedCount = records.filter((record) => record.approvalStatus === "checked").length;
  const filtered = records.filter((record) => {
    if (tab === "queue" && (record.submissionStatus !== "submitted" || record.approvalStatus !== "pending")) return false;
    if (tab === "checked" && record.approvalStatus !== "checked") return false;
    if (line && record.line !== line) return false;
    if (area && !record.assignedAreas.includes(Number(area))) return false;
    if (month && record.month !== month) return false;
    const haystack = `${record.line} ${record.operatorName} ${record.assignedAreas.join(" ")}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const rows = filtered;

  return (
    <main className="dashboard-shell">
      <section className="dashboard-panel">
        <header className="dashboard-header no-print">
          <Link href="/" className="back-button" aria-label="Back to role selection"><ArrowLeft size={22} /></Link>
          <div><p className="eyebrow">LEADING CHECKLIST</p><h1>Checklist Dashboard</h1><p className="lead">Browser-session review of Operator checklist activity.</p></div>
          <span className="session-badge">Chrome mock session</span>
        </header>

        <div className="dashboard-filters no-print">
          <label className="dashboard-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search line or operator..." /></label>
          <label><span>Line</span><select value={line} onChange={(event) => setLine(event.target.value)}><option value="">All lines</option>{lines.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
          <label><span>Area</span><select value={area} onChange={(event) => setArea(event.target.value)}><option value="">All areas</option>{AREA_STATIONS.map((value) => <option value={value.number} key={value.number}>Area {value.number} - {value.name}</option>)}</select></label>
          <label><span>Month</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
          <button type="button" className="reset-filter" onClick={() => { setSearch(""); setLine(""); setArea(""); setMonth(""); }}><FilterX size={18} />Reset</button>
        </div>

        <div className="queue-tabs no-print">
          <button type="button" className={tab === "queue" ? "active" : ""} onClick={() => setTab("queue")}>My Queue <span>{queueCount}</span></button>
          <button type="button" className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>All Records <span>{records.length}</span></button>
          <button type="button" className={tab === "checked" ? "active" : ""} onClick={() => setTab("checked")}>Checked <span>{checkedCount}</span></button>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead><tr><th>Line</th><th>Month</th><th>Assigned areas</th><th>Operator</th><th>Progress</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((record) => {
                const totalForms = record.assignedAreas.length * 3;
                return <tr key={record.id}><td><strong>{record.line}</strong></td><td>{record.month}</td><td>{record.assignedAreas.map((value) => <span className="area-token" key={value}>{value}</span>)}</td><td>{record.operatorName}</td><td>{record.completedForms.length}/{totalForms} forms</td><td><span className={`approval-pill ${record.approvalStatus}`}>{record.approvalStatus === "checked" ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}{record.approvalStatus === "checked" ? "Checked" : "Need review"}</span></td><td>{new Date(record.updatedAt).toLocaleString()}</td><td><button type="button" className="review-button" onClick={() => setSelected(record)}><Eye size={17} />Review</button></td></tr>;
              })}
              {!rows.length && <tr><td colSpan={8}><div className="empty-dashboard"><Factory size={34} /><strong>No Operator checklist data found</strong><p>Complete or save a form through the Operator flow in this same browser and domain.</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <DashboardAnalysis records={records} initialLine={initialLine} />

      {selected && <DashboardReview record={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function DashboardAnalysis({ records, initialLine }: { records: BrowserChecklistRecord[]; initialLine: string }) {
  const [line, setLine] = useState(initialLine);
  const [process, setProcess] = useState("");
  const [mode, setMode] = useState<"period" | "month">("period");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const lines = [...new Set(records.map((record) => record.line))];
  const matching = records.filter((record) => (!line || record.line === line) && record.submissionStatus === "submitted");
  const record = matching[0] ?? records.find((entry) => entry.submissionStatus === "submitted") ?? records[0];
  const contributingRecords = matching.length ? matching : record ? [record] : [];
  const areas = [...new Set(contributingRecords.flatMap((entry) => entry.assignedAreas))].sort((left, right) => left - right);
  const combinedAnswers = Object.assign({}, ...contributingRecords.map((entry) => entry.answers)) as Record<string, string>;
  const forms = areas.flatMap(formsForArea).filter((form) => !process || form.id.includes(process));
  const days = Array.from({ length: 31 }, (_, index) => index + 1);
  const values = [22, 28, 24, 26, 28, 23, 29, 26, 26, 54, 27, 28, 19, 24, 25, 21, 27, 23, 25, 29, 21, 27, 23, 25, 28, 23, 27, 26, 28, 24, 26];
  const chartPoints = values.map((value, index) => `${42 + index * 24},${210 - ((value - 8) / 48) * 170}`).join(" ");
  const answerForDay = (itemId: string, day: number) => {
    if (combinedAnswers[itemId] && day === new Date(record.updatedAt).getDate()) return combinedAnswers[itemId];
    if (day > 25) return "";
    return day % 4 === 0 ? "OK" : day % 3 === 0 ? "✓" : "○";
  };

  return <section className="analysis-panel">
    <div className="analysis-filters no-print">
      <label><span>Line</span><select value={line} onChange={(event) => setLine(event.target.value)}><option value="">All</option>{lines.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label><span>Process</span><select value={process} onChange={(event) => setProcess(event.target.value)}><option value="">All</option><option value="startup">Start-up Check</option><option value="process">Process Check</option><option value="quality">Quality Check</option></select></label>
      <div className="date-mode"><span>Date filter</span><div><button className={mode === "period" ? "active" : ""} onClick={() => setMode("period")} type="button">Period</button><button className={mode === "month" ? "active" : ""} onClick={() => setMode("month")} type="button">Month</button></div></div>
      <label><span>From date</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
      <label><span>To date</span><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
      <button type="button" className="analysis-pdf" onClick={() => window.print()}><FileDown size={17} />Generate PDF</button>
    </div>

    <div className="monthly-sheet">
      <header><div><h2>Daily Checklist {record?.line ?? "Mock Line"}</h2><p>Month: {record?.month ?? "Mock month"} · Digital browser-session result</p></div><div className="sign-box"><span>Checked</span><strong>{record?.approvalStatus === "checked" ? "✓" : ""}</strong></div><div className="sign-box"><span>Approved</span><strong>{record?.approvalStatus === "checked" ? "✓" : ""}</strong></div></header>
      <div className="monthly-grid-wrap"><table className="monthly-grid"><thead><tr><th>No.</th><th>Item check</th><th>Specification</th>{days.map((day) => <th key={day}>{day}</th>)}</tr></thead><tbody>{forms.flatMap((form, formIndex) => form.items.map((item, itemIndex) => <tr key={item.id}><td>{formIndex * 10 + itemIndex + 1}</td><td><strong>{item.name}</strong><small>{form.title}</small></td><td>{item.specification}</td>{days.map((day) => <td key={day}>{answerForDay(item.id, day)}</td>)}</tr>))}</tbody></table></div>
    </div>

    <div className="control-chart-card"><h2>Process Control Trend</h2><svg viewBox="0 0 800 250" role="img" aria-label="Mock monthly process control chart"><line className="axis" x1="42" y1="210" x2="770" y2="210" /><line className="axis" x1="42" y1="25" x2="42" y2="210" /><line className="ucl" x1="42" y1="70" x2="770" y2="70" /><line className="zone" x1="42" y1="105" x2="770" y2="105" /><line className="average" x1="42" y1="145" x2="770" y2="145" /><line className="zone" x1="42" y1="180" x2="770" y2="180" /><polyline points={chartPoints} />{values.map((value, index) => <circle key={index} cx={42 + index * 24} cy={210 - ((value - 8) / 48) * 170} r={value > 42 ? 5 : 3.5} className={value > 42 ? "alert-point" : ""} />)}<text x="48" y="64">UCL 41.9</text><text x="48" y="139">Avg 26.2</text><text x="704" y="98">ZONE A</text><text x="704" y="139">ZONE B</text><text x="704" y="174">ZONE C</text></svg></div>
  </section>;
}

function DashboardReview({ record, onClose }: { record: BrowserChecklistRecord; onClose: () => void }) {
  const allForms = record.assignedAreas.flatMap(formsForArea);
  const numericValues = Object.values(record.answers).map(Number).filter((value) => Number.isFinite(value));
  const chartValues = numericValues.length >= 5 ? numericValues.slice(0, 12) : [22, 25, 24, 28, 26, 27, 31, 25, 29, 27, 30, 26];
  const points = chartValues.map((value, index) => `${20 + index * (560 / Math.max(chartValues.length - 1, 1))},${150 - ((value - Math.min(...chartValues)) / Math.max(Math.max(...chartValues) - Math.min(...chartValues), 1)) * 100}`).join(" ");

  return <div className="modal-backdrop" role="presentation"><section className="dashboard-review-modal" role="dialog" aria-modal="true"><button className="modal-close no-print" type="button" onClick={onClose} aria-label="Close"><X /></button>
    <header><p className="eyebrow">CHECKLIST REVIEW</p><h2>{record.line}</h2><p>{record.month} · Areas {record.assignedAreas.join(", ")} · {record.operatorName}</p></header>
    <div className="review-paper">
      <div className="paper-title"><div><strong>Daily Checklist Result</strong><span>Digital mock generated from Operator input</span></div><span className={`approval-pill ${record.approvalStatus}`}>{record.approvalStatus === "checked" ? "Checked / Approved" : "Waiting for review"}</span></div>
      <table><thead><tr><th>Area</th><th>Checklist</th><th>Item check</th><th>Specification</th><th>Result</th></tr></thead><tbody>{record.assignedAreas.flatMap((areaNumber) => formsForArea(areaNumber).flatMap((form) => form.items.map((item) => <tr key={item.id}><td>{areaNumber}</td><td>{form.title}</td><td>{item.name}</td><td>{item.specification}</td><td>{record.answers[item.id] || "-"}</td></tr>)))}</tbody></table>
    </div>
    <div className="mock-control-chart"><h3>Mock Process Trend</h3><svg viewBox="0 0 600 180" role="img" aria-label="Mock process trend"><line x1="20" y1="150" x2="580" y2="150" /><line x1="20" y1="25" x2="20" y2="150" /><line className="limit" x1="20" y1="50" x2="580" y2="50" /><line className="average" x1="20" y1="100" x2="580" y2="100" /><polyline points={points} /></svg></div>
    <footer className="dashboard-review-actions no-print"><button type="button" className="secondary-button" onClick={() => window.print()}><FileDown size={18} />Generate PDF</button></footer>
  </section></div>;
}
