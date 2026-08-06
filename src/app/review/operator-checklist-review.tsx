"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, Eye, Factory, PencilLine, TriangleAlert, UserRound, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AREA_STATIONS, ChecklistItem, formsForArea } from "@/lib/mock-checklist";
import { BrowserChecklistRecord, buildMockSubmittedRecord, checklistStorageKey, CHECKLIST_STORAGE_PREFIX } from "@/lib/mock-session";

function readSubmittedRecords(line: string): BrowserChecklistRecord[] {
  const records: BrowserChecklistRecord[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(CHECKLIST_STORAGE_PREFIX)) continue;
    try {
      const record = JSON.parse(window.localStorage.getItem(key) ?? "") as BrowserChecklistRecord;
      if (record.id && record.line === line && record.submissionStatus === "submitted") records.push(record);
    } catch {
      // Ignore malformed mock records without affecting other browser data.
    }
  }
  return records;
}

function recordItems(record: BrowserChecklistRecord) {
  return record.assignedAreas.flatMap((area) => formsForArea(area)).flatMap((form) => form.items);
}

export default function OperatorChecklistReview() {
  const router = useRouter();
  const params = useSearchParams();
  const line = params.get("line") || "Mock Production Line";

  const [records, setRecords] = useState<BrowserChecklistRecord[]>([]);
  const [selected, setSelected] = useState<BrowserChecklistRecord | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [editingAreas, setEditingAreas] = useState<Set<number>>(() => new Set());
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  const refresh = useCallback(() => {
    const found = readSubmittedRecords(line);
    if (found.length) return setRecords(found);
    const mock = buildMockSubmittedRecord(line, [1, 2]);
    mock.answers["a1-quality-sample-condition"] = "NG";
    setRecords([mock]);
  }, [line]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = (area: number) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  const openRecord = (record: BrowserChecklistRecord) => {
    setSelected(record);
    setEdits(record.answers);
    setEditingAreas(new Set());
    setOpen(new Set(record.assignedAreas.slice(0, 1)));
  };

  const startEditing = (area: number) => {
    setEditingAreas((current) => new Set(current).add(area));
  };

  const saveArea = (area: number) => {
    if (!selected) return;
    const updated: BrowserChecklistRecord = { ...selected, answers: edits, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(checklistStorageKey(updated.line, updated.assignedAreas), JSON.stringify(updated));
    setSelected(updated);
    setEditingAreas((current) => {
      const next = new Set(current);
      next.delete(area);
      return next;
    });
    refresh();
  };

  const cancelEditing = (area: number) => {
    setEditingAreas((current) => {
      const next = new Set(current);
      next.delete(area);
      return next;
    });
    if (selected) setEdits(selected.answers);
  };

  const distinctAreas = useMemo(() => {
    const set = new Set<number>();
    for (const record of records) record.assignedAreas.forEach((area) => set.add(area));
    return [...set].sort((left, right) => left - right);
  }, [records]);

  const approvedAreas = distinctAreas.filter((area) => records.find((record) => record.assignedAreas.includes(area))?.approvalStatus === "checked").length;
  const awaitingAreas = distinctAreas.length - approvedAreas;

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
          <button className="primary-button" type="button" onClick={() => router.push(`/dashboard?line=${encodeURIComponent(line)}`)}>Open dashboard<ArrowRight size={18} /></button>
        </header>

        <div className="review-stats">
          <div><CheckCircle2 /><span><strong>{approvedAreas}</strong>Approved areas</span></div>
          <div><Clock3 /><span><strong>{awaitingAreas}</strong>Awaiting review</span></div>
          <div><ClipboardCheck /><span><strong>{distinctAreas.length}</strong>Submitted steps</span></div>
        </div>

        <div className="review-table-wrap">
          <table className="review-table">
            <thead><tr><th>Operator</th><th>Assigned steps</th><th>Month</th><th>Progress</th><th>NG</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {records.map((record) => {
                const items = recordItems(record);
                const answered = items.filter((item) => Boolean(record.answers[item.id])).length;
                const ngCount = items.filter((item) => record.answers[item.id] === "NG").length;
                return (
                  <tr key={record.id}>
                    <td><span className="operator-name"><UserRound size={15} />{record.operatorName}</span></td>
                    <td>{record.assignedAreas.map((area) => <span className="area-token" key={area}>{area}</span>)}</td>
                    <td>{record.month}</td>
                    <td><span className="progress-value">{answered}/{items.length}</span></td>
                    <td>{ngCount ? <span className="ng-badge"><TriangleAlert size={14} />{ngCount} NG</span> : <span className="empty-value">—</span>}</td>
                    <td><span className={`status-pill ${record.approvalStatus === "checked" ? "completed" : "in-progress"}`}>{record.approvalStatus === "checked" ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}{record.approvalStatus === "checked" ? "Checked" : "Need review"}</span></td>
                    <td><button className="view-page" type="button" onClick={() => openRecord(record)}><Eye size={17} />View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mock-note">Leading can review and directly edit Operator entries inside each step before approval.</p>
      </section>

      {selected && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
          <section className="review-detail review-detail-wide" role="dialog" aria-modal="true" aria-labelledby="review-detail-title">
            <button className="modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close">×</button>
            <p className="eyebrow">OPERATOR SUBMISSION · {line}</p>
            <h2 id="review-detail-title">Checklist Results</h2>
            <div className="detail-meta"><span>Operator</span><strong>{selected.operatorName}</strong><span>Month</span><strong>{selected.month}</strong><span>Assigned steps</span><strong>{selected.assignedAreas.join(", ")}</strong></div>

            <div className="review-accordion-list">
              {selected.assignedAreas.map((area) => {
                const station = AREA_STATIONS[area - 1];
                const forms = formsForArea(area);
                const items = forms.flatMap((form) => form.items);
                const answered = items.filter((item) => Boolean(selected.answers[item.id])).length;
                const ngItems = items.filter((item) => selected.answers[item.id] === "NG");
                const isOpen = open.has(area);
                const isEditing = editingAreas.has(area);
                return (
                  <div className={`review-accordion${isOpen ? " open" : ""}`} key={area}>
                    <button className="review-accordion-head" type="button" onClick={() => toggle(area)} aria-expanded={isOpen}>
                      <span className="table-page">{area}</span>
                      <span className="acc-copy"><strong>{station.name}</strong><small>{station.process}</small></span>
                      <span className="acc-meta">
                        <span className="progress-value">{answered}/{items.length} items</span>
                        {ngItems.length > 0 && <span className="ng-badge"><TriangleAlert size={14} />{ngItems.length} NG</span>}
                        <span className={`status-pill ${selected.approvalStatus === "checked" ? "completed" : "in-progress"}`}>{selected.approvalStatus === "checked" ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}{selected.approvalStatus === "checked" ? "Checked" : "Need review"}</span>
                      </span>
                      <ChevronDown className="acc-chevron" size={20} />
                    </button>

                    {isOpen && (
                      <div className="review-accordion-body">
                        <div className="accordion-toolbar">
                          {isEditing ? (
                            <>
                              <span className="editing-hint"><PencilLine size={14} />Editing this area — changes apply on save</span>
                              <button className="save-area-button" type="button" onClick={() => saveArea(area)}><Check size={15} />Save</button>
                              <button className="cancel-area-button" type="button" onClick={() => cancelEditing(area)}><X size={15} />Cancel</button>
                            </>
                          ) : (
                            <button className="edit-area-button" type="button" onClick={() => startEditing(area)}><PencilLine size={15} />Edit data</button>
                          )}
                        </div>
                        <div className="review-table-wrap">
                          <table className="review-table review-area-table">
                            <thead><tr><th>Checklist</th><th>Item check</th><th>Specification</th><th>Result</th></tr></thead>
                            <tbody>
                              {forms.flatMap((form) => form.items.map((item) => {
                                const value = (isEditing ? edits : selected.answers)[item.id] || "—";
                                const isNg = value === "NG";
                                return <tr key={item.id}><td>{form.title}</td><td><strong>{item.name}</strong></td><td>{item.specification}</td><td>{isEditing ? <InlineAnswer item={item} value={value} onChange={(next) => setEdits((current) => ({ ...current, [item.id]: next }))} /> : isNg ? <span className="result-ng">NG</span> : <span className="result-value">{value}</span>}</td></tr>;
                              }))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function InlineAnswer({ item, value, onChange }: { item: ChecklistItem; value: string; onChange: (value: string) => void }) {
  if (item.answerType === "choice") {
    return <div className="inline-choice three">{["OK", "NG", "N/A"].map((choice) => <button type="button" className={value === choice ? `selected ${choice.toLowerCase()}` : ""} onClick={() => onChange(choice)} key={choice}>{choice}</button>)}</div>;
  }
  if (item.answerType === "number") {
    return <label className="inline-number"><input type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" /><span>{item.unit}</span></label>;
  }
  return <input className="inline-text" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Type note only if needed" />;
}
