"use client";

import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, Eye, Factory, PencilLine, Send, TriangleAlert, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChecklistItem, documentsForLine, formsForDocument } from "@/lib/mock-checklist";
import { BrowserChecklistRecord, checklistStorageKey, CHECKLIST_STORAGE_PREFIX } from "@/lib/mock-session";

type ShiftGroup = { shift: string; records: BrowserChecklistRecord[] };

function readLineRecords(line: string): BrowserChecklistRecord[] {
  const records: BrowserChecklistRecord[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(CHECKLIST_STORAGE_PREFIX)) continue;
    try {
      const record = JSON.parse(window.localStorage.getItem(key) ?? "") as BrowserChecklistRecord;
      if (record.id && record.line === line) records.push(record);
    } catch { /* Ignore malformed mock records. */ }
  }
  return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function recordItems(record: BrowserChecklistRecord) {
  return record.assignedAreas.flatMap((document) => formsForDocument(document, record.line)).flatMap((form) => form.items);
}

function groupRecordsByShift(records: BrowserChecklistRecord[]): ShiftGroup[] {
  const grouped = new Map<string, BrowserChecklistRecord[]>();
  for (const record of records) grouped.set(record.shift || "Shift 1", [...(grouped.get(record.shift || "Shift 1") ?? []), record]);
  return [...grouped.entries()].map(([shift, entries]) => ({ shift, records: entries }));
}

export default function OperatorChecklistReview() {
  const router = useRouter();
  const params = useSearchParams();
  const line = params.get("line") || "Mock Production Line";
  const documents = useMemo(() => documentsForLine(line), [line]);
  const [records, setRecords] = useState<BrowserChecklistRecord[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ShiftGroup | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Set<number>>(() => new Set());

  const refresh = useCallback(() => setRecords(readLineRecords(line)), [line]);
  useEffect(() => {
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); };
  }, [refresh]);

  const groups = useMemo(() => groupRecordsByShift(records), [records]);
  const finalCount = records.filter((record) => record.approvalStatus === "checked").length;
  const reviewCount = records.length - finalCount;
  const selectedFinalized = selectedGroup?.records.every((record) => record.approvalStatus === "checked") ?? false;
  const selectedComplete = selectedGroup?.records.every((record) => recordItems(record).every((item) => Boolean(edits[item.id]))) ?? false;

  const openGroup = (group: ShiftGroup) => {
    setSelectedGroup(group);
    setEdits(Object.assign({}, ...group.records.map((record) => record.answers)) as Record<string, string>);
    setOpen(new Set(group.records.flatMap((record) => record.assignedAreas).slice(0, 1)));
  };

  const toggle = (document: number) => setOpen((current) => {
    const next = new Set(current);
    if (next.has(document)) next.delete(document); else next.add(document);
    return next;
  });

  const saveProgress = (finalize: boolean) => {
    if (!selectedGroup) return;
    const now = new Date().toISOString();
    const updatedRecords = selectedGroup.records.map((record) => {
      const itemIds = new Set(recordItems(record).map((item) => item.id));
      const answers = { ...record.answers };
      for (const [id, value] of Object.entries(edits)) if (itemIds.has(id)) answers[id] = value;
      const forms = record.assignedAreas.flatMap((document) => formsForDocument(document, record.line));
      const completedForms = forms.filter((form) => form.items.every((item) => Boolean(answers[item.id]))).map((form) => form.id);
      const updated: BrowserChecklistRecord = {
        ...record, answers, completedForms, updatedAt: now,
        submissionStatus: finalize ? "submitted" : "draft",
        submittedAt: finalize ? now : record.submittedAt,
        approvalStatus: finalize ? "checked" : "pending",
        checkedAt: finalize ? now : record.checkedAt,
        checkedBy: finalize ? "Mock Leading User" : record.checkedBy,
      };
      window.localStorage.setItem(checklistStorageKey(updated.line, updated.assignedAreas), JSON.stringify(updated));
      return updated;
    });
    setSelectedGroup({ ...selectedGroup, records: updatedRecords });
    refresh();
    if (finalize) router.push(`/dashboard?line=${encodeURIComponent(line)}`);
  };

  return <main className="review-shell"><section className="review-panel">
    <header className="review-header">
      <Link href="/verify?role=leading" className="back-button" aria-label="Back to line selection"><ArrowLeft size={22} /></Link>
      <div><p className="eyebrow">LEADING CHECKLIST REVIEW</p><h1>Operator Checklist Progress</h1><p className="lead"><Factory size={17} /> {line}</p></div>
      <span className="mock-badge">Mock data</span>
    </header>

    <div className="review-stats">
      <div><CheckCircle2 /><span><strong>{finalCount}</strong>Finalized records</span></div>
      <div><Clock3 /><span><strong>{reviewCount}</strong>Available for review</span></div>
      <div><ClipboardCheck /><span><strong>{records.length}</strong>Saved sessions</span></div>
    </div>

    <div className="review-table-wrap"><table className="review-table">
      <thead><tr><th>Shift</th><th>Month</th><th>Progress</th><th>NG</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>{groups.map((group) => {
        const items = group.records.flatMap(recordItems);
        const answered = items.filter((item) => group.records.some((record) => Boolean(record.answers[item.id]))).length;
        const ngCount = items.filter((item) => group.records.some((record) => record.answers[item.id] === "NG")).length;
        const finalized = group.records.every((record) => record.approvalStatus === "checked");
        return <tr key={group.shift}>
          <td><span className="table-page">{group.shift}</span></td>
          <td>{[...new Set(group.records.map((record) => record.month))].join(", ")}</td>
          <td><span className="progress-value">{answered}/{items.length}</span></td>
          <td>{ngCount ? <span className="ng-badge"><TriangleAlert size={14} />{ngCount} NG</span> : <span className="empty-value">—</span>}</td>
          <td><span className={`status-pill ${finalized ? "completed" : "in-progress"}`}>{finalized ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}{finalized ? "Sent to dashboard" : "Need review"}</span></td>
          <td><button className="view-page" type="button" onClick={() => openGroup(group)}><Eye size={17} />Review</button></td>
        </tr>;
      })}
      {!groups.length && <tr><td colSpan={6}><div className="empty-dashboard"><Factory size={34} /><strong>No Operator progress yet</strong><p>Operator autosaved data for this line will appear here immediately.</p></div></td></tr>}</tbody>
    </table></div>
    <p className="mock-note">Leading can review and complete unfinished Operator fields. Only Leading can submit the final result to Dashboard.</p>
  </section>

  {selectedGroup && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedGroup(null); }}>
    <section className="review-detail review-detail-wide" role="dialog" aria-modal="true">
      <button className="modal-close" type="button" onClick={() => setSelectedGroup(null)} aria-label="Close">×</button>
      <p className="eyebrow">LEADING FINAL REVIEW · {line}</p><h2>Checklist Progress · {selectedGroup.shift}</h2>
      <div className="review-accordion-list">{[...new Set(selectedGroup.records.flatMap((record) => record.assignedAreas))].sort((a, b) => a - b).map((documentNumber) => {
        const record = selectedGroup.records.find((entry) => entry.assignedAreas.includes(documentNumber));
        const document = documents.find((entry) => entry.number === documentNumber);
        if (!record || !document) return null;
        const forms = formsForDocument(documentNumber, line);
        const items = forms.flatMap((form) => form.items);
        const answered = items.filter((item) => Boolean(edits[item.id])).length;
        const isOpen = open.has(documentNumber);
        return <div className={`review-accordion${isOpen ? " open" : ""}`} key={documentNumber}>
          <button className="review-accordion-head" type="button" onClick={() => toggle(documentNumber)}><span className="table-page">{documentNumber}</span><span className="acc-copy"><strong>{document.name}</strong><small>{document.process}</small></span><span className="progress-value">{answered}/{items.length} items</span><ChevronDown size={19} /></button>
          {isOpen && <div className="review-accordion-body"><div className="review-area-actions"><span><PencilLine size={15} />Leading may complete or correct every result below.</span></div><div className="review-table-wrap"><table className="review-table review-area-table"><thead><tr><th>Checklist</th><th>Item check</th><th>Specification</th><th>Result</th></tr></thead><tbody>{forms.flatMap((form) => form.items.map((item) => <tr key={item.id}><td>{form.title}</td><td><strong>{item.name}</strong></td><td>{item.specification}</td><td><InlineAnswer item={item} value={edits[item.id] ?? ""} onChange={(value) => setEdits((current) => ({ ...current, [item.id]: value }))} /></td></tr>))}</tbody></table></div></div>}
        </div>;
      })}</div>
      <footer className="dashboard-review-actions">{selectedFinalized ? <span className="status-pill completed"><CheckCircle2 size={16} />Already sent to Dashboard</span> : <><button className="secondary-button" type="button" onClick={() => saveProgress(false)}><Check size={18} />Save Leading progress</button><button className="complete-button" type="button" disabled={!selectedComplete} title={selectedComplete ? "Submit final result" : "Complete all checklist fields first"} onClick={() => saveProgress(true)}><Send size={18} />Submit final to Dashboard</button></>}</footer>
    </section>
  </div>}
  </main>;
}

function InlineAnswer({ item, value, onChange }: { item: ChecklistItem; value: string; onChange: (value: string) => void }) {
  if (item.answerType === "choice") return <div className="inline-choice three">{["OK", "NG", "N/A"].map((choice) => <button type="button" className={value === choice ? `selected ${choice.toLowerCase()}` : ""} onClick={() => onChange(choice)} key={choice}>{choice}</button>)}</div>;
  if (item.answerType === "number") return <label className="inline-number"><input type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" /><span>{item.unit}</span></label>;
  return <input className="inline-text" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Type note only if needed" />;
}
