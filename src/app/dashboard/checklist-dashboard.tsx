"use client";

import { AREA_STATIONS, formsForArea } from "@/lib/mock-checklist";
import { BrowserChecklistRecord, CHECKLIST_STORAGE_PREFIX, checklistStorageKey } from "@/lib/mock-session";
import { ArrowLeft, Check, CheckCircle2, Clock3, Eye, Factory, FileDown, FilterX, Search, X } from "lucide-react";
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
      if (record.id && record.line) records.push(record);
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
  const [tab, setTab] = useState<QueueTab>("queue");
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
  const queueCount = records.filter((record) => record.approvalStatus === "pending").length;
  const checkedCount = records.filter((record) => record.approvalStatus === "checked").length;
  const filtered = records.filter((record) => {
    if (tab === "queue" && record.approvalStatus !== "pending") return false;
    if (tab === "checked" && record.approvalStatus !== "checked") return false;
    if (line && record.line !== line) return false;
    if (area && !record.assignedAreas.includes(Number(area))) return false;
    if (month && record.month !== month) return false;
    const haystack = `${record.line} ${record.operatorName} ${record.assignedAreas.join(" ")}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const approve = (record: BrowserChecklistRecord) => {
    const updated: BrowserChecklistRecord = { ...record, approvalStatus: "checked", checkedAt: new Date().toISOString(), checkedBy: "Mock Leading User" };
    window.localStorage.setItem(checklistStorageKey(record.line, record.assignedAreas), JSON.stringify(updated));
    setSelected(updated);
    refresh();
  };

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
              {filtered.map((record) => {
                const totalForms = record.assignedAreas.length * 3;
                return <tr key={record.id}><td><strong>{record.line}</strong></td><td>{record.month}</td><td>{record.assignedAreas.map((value) => <span className="area-token" key={value}>{value}</span>)}</td><td>{record.operatorName}</td><td>{record.completedForms.length}/{totalForms} forms</td><td><span className={`approval-pill ${record.approvalStatus}`}>{record.approvalStatus === "checked" ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}{record.approvalStatus === "checked" ? "Checked" : "Need review"}</span></td><td>{new Date(record.updatedAt).toLocaleString()}</td><td><button type="button" className="review-button" onClick={() => setSelected(record)}><Eye size={17} />Review</button></td></tr>;
              })}
              {!filtered.length && <tr><td colSpan={8}><div className="empty-dashboard"><Factory size={34} /><strong>No Operator checklist data found</strong><p>Complete or save a form through the Operator flow in this same browser and domain.</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {selected && <DashboardReview record={selected} onClose={() => setSelected(null)} onApprove={() => approve(selected)} />}
    </main>
  );
}

function DashboardReview({ record, onClose, onApprove }: { record: BrowserChecklistRecord; onClose: () => void; onApprove: () => void }) {
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
    <footer className="dashboard-review-actions no-print"><button type="button" className="secondary-button" onClick={() => window.print()}><FileDown size={18} />Generate PDF</button>{record.approvalStatus === "pending" && <button type="button" className="complete-button" onClick={onApprove}><Check size={18} />Checked / Approved</button>}</footer>
  </section></div>;
}
