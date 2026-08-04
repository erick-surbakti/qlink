"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ClipboardCheck, Clock3, Eye, Factory, MinusCircle, UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type MockPage = {
  page: number;
  title: string;
  operator: string | null;
  status: "completed" | "in-progress" | "not-started";
  completedItems: number;
  totalItems: number;
};

const MOCK_PAGES: MockPage[] = [
  { page: 1, title: "Input Material", operator: "Mock Operator A", status: "completed", completedItems: 3, totalItems: 3 },
  { page: 2, title: "Pre-Assembly", operator: "Mock Operator A", status: "completed", completedItems: 3, totalItems: 3 },
  { page: 3, title: "Assembly 1", operator: "Mock Operator A", status: "completed", completedItems: 3, totalItems: 3 },
  { page: 4, title: "Assembly 2", operator: "Mock Operator B", status: "completed", completedItems: 3, totalItems: 3 },
  { page: 5, title: "Adjustment", operator: "Mock Operator B", status: "completed", completedItems: 3, totalItems: 3 },
  { page: 6, title: "Inspection 1", operator: "Mock Operator B", status: "in-progress", completedItems: 2, totalItems: 3 },
  { page: 7, title: "Inspection 2", operator: "Mock Operator B", status: "in-progress", completedItems: 1, totalItems: 3 },
  { page: 8, title: "Final Check", operator: null, status: "not-started", completedItems: 0, totalItems: 3 },
  { page: 9, title: "Packing", operator: null, status: "not-started", completedItems: 0, totalItems: 3 },
  { page: 10, title: "Output", operator: null, status: "not-started", completedItems: 0, totalItems: 3 },
];

const STATUS = {
  completed: { label: "Completed", icon: CheckCircle2 },
  "in-progress": { label: "In progress", icon: Clock3 },
  "not-started": { label: "Not started", icon: MinusCircle },
} as const;

export default function OperatorChecklistReview() {
  const params = useSearchParams();
  const line = params.get("line") || "Mock Production Line";
  const [selected, setSelected] = useState<MockPage | null>(null);
  const completed = MOCK_PAGES.filter((item) => item.status === "completed").length;
  const inProgress = MOCK_PAGES.filter((item) => item.status === "in-progress").length;

  return (
    <main className="review-shell">
      <section className="review-panel">
        <header className="review-header">
          <Link href="/verify?role=leading" className="back-button" aria-label="Back to line selection"><ArrowLeft size={22} /></Link>
          <div>
            <p className="eyebrow">LEADING CHECKLIST REVIEW</p>
            <h1>Operator Checklist Results</h1>
            <p className="lead"><Factory size={17} /> {line}</p>
          </div>
          <span className="mock-badge">Mock data</span>
        </header>

        <div className="review-stats">
          <div><CheckCircle2 /><span><strong>{completed}</strong>Completed areas</span></div>
          <div><Clock3 /><span><strong>{inProgress}</strong>In progress</span></div>
          <div><ClipboardCheck /><span><strong>{MOCK_PAGES.length}</strong>Total pages</span></div>
        </div>

        <div className="review-table-wrap">
          <table className="review-table">
            <thead><tr><th>Area</th><th>U-line station</th><th>Operator</th><th>Forms</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {MOCK_PAGES.map((item) => {
                const state = STATUS[item.status];
                const StatusIcon = state.icon;
                return (
                  <tr key={item.page}>
                    <td><span className="table-page">{item.page}</span></td>
                    <td><strong>{item.title}</strong></td>
                    <td>{item.operator ? <span className="operator-name"><UserRound size={15} />{item.operator}</span> : <span className="empty-value">—</span>}</td>
                    <td><span className="progress-value">{item.completedItems}/{item.totalItems}</span></td>
                    <td><span className={`status-pill ${item.status}`}><StatusIcon size={15} />{state.label}</span></td>
                    <td><button className="view-page" type="button" disabled={item.status === "not-started"} onClick={() => setSelected(item)}><Eye size={17} />View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mock-note">Leading is read-only in this prototype and reviews checklist areas submitted by Operators.</p>
      </section>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="review-detail" role="dialog" aria-modal="true" aria-labelledby="review-detail-title">
            <button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <p className="eyebrow">OPERATOR SUBMISSION · AREA {selected.page}</p>
            <h2 id="review-detail-title">{selected.title}</h2>
            <div className="detail-meta"><span>Operator</span><strong>{selected.operator}</strong><span>Progress</span><strong>{selected.completedItems}/{selected.totalItems} items</strong></div>
            <div className="mock-check-items">
              {Array.from({ length: selected.totalItems }, (_, index) => (
                <div key={index}><span className={index < selected.completedItems ? "mock-check done" : "mock-check"}>{index < selected.completedItems ? "OK" : ""}</span><p><strong>Mock checklist form {index + 1}</strong><small>{index < selected.completedItems ? "Operator completed this form." : "Waiting for Operator input."}</small></p></div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
