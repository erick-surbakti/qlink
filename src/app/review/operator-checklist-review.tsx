"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, Eye, Factory, PencilLine, TriangleAlert, UserRound, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AREA_STATIONS, ChecklistItem, formsForArea } from "@/lib/mock-checklist";
import { BrowserChecklistRecord, buildMockSubmittedRecord, checklistStorageKey, CHECKLIST_STORAGE_PREFIX } from "@/lib/mock-session";

type ShiftGroup = { shift: string; records: BrowserChecklistRecord[] };

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

function groupRecordsByShift(records: BrowserChecklistRecord[]): ShiftGroup[] {
  const map = new Map<string, BrowserChecklistRecord[]>();
  for (const record of records) {
    const key = record.shift || "Shift 1";
    const list = map.get(key) ?? [];
    list.push(record);
    map.set(key, list);
  }
  return [...map.entries()]
    .map(([shift, groupRecords]) => ({ shift, records: groupRecords }))
    .sort((left, right) => left.shift.localeCompare(right.shift));
}

export default function OperatorChecklistReview() {
  const router = useRouter();
  const params = useSearchParams();
  const line = params.get("line") || "Mock Production Line";

  const [records, setRecords] = useState<BrowserChecklistRecord[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ShiftGroup | null>(null);
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

  const shiftGroups = useMemo(() => groupRecordsByShift(records), [records]);

  const distinctAreas = useMemo(() => {
    const set = new Set<number>();
    for (const record of records) record.assignedAreas.forEach((area) => set.add(area));
    return [...set].sort((left, right) => left - right);
  }, [records]);

  const approvedAreas = distinctAreas.filter((area) => records.find((record) => record.assignedAreas.includes(area))?.approvalStatus === "checked").length;
  const awaitingAreas = distinctAreas.length - approvedAreas;

  const toggle = (area: number) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  const openGroup = (group: ShiftGroup) => {
    setSelectedGroup(group);
    setEdits({});
    setEditingAreas(new Set());
    const steps = [...new Set(group.records.flatMap((record) => record.assignedAreas))].sort((left, right) => left - right);
    setOpen(new Set(steps.slice(0, 1)));
  };

  const areaRecord = (group: ShiftGroup, area: number) => group.records.find((record) => record.assignedAreas.includes(area));

  const startEditing = (area: number) => {
    setEditingAreas((current) => new Set(current).add(area));
  };

  const saveArea = (area: number) => {
    if (!selectedGroup) return;
    const record = areaRecord(selectedGroup, area);
    if (!record) return;
    const recordIds = new Set(recordItems(record).map((item) => item.id));
    const answers = { ...record.answers };
    for (const [id, value] of Object.entries(edits)) if (recordIds.has(id)) answers[id] = value;
    const updated: BrowserChecklistRecord = { ...record, answers, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(checklistStorageKey(updated.line, updated.assignedAreas), JSON.stringify(updated));
    setSelectedGroup((group) => group ? { ...group, records: group.records.map((entry) => entry.id === record.id ? updated : entry) } : group);
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
    setEdits((current) => {
      const next = { ...current };
      for (const item of formsForArea(area).flatMap((form) => form.items)) delete next[item.id];
      return next;
    });
  };

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
            <thead><tr><th>Shift</th><th>Operators</th><th>Assigned steps</th><th>Month</th><th>Progress</th><th>NG</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {shiftGroups.map((group) => {
                const operators = [...new Set(group.records.map((record) => record.operatorName))].join(", ");
                const months = [...new Set(group.records.map((record) => record.month))].join(", ");
                const steps = [...new Set(group.records.flatMap((record) => record.assignedAreas))].sort((left, right) => left - right);
                const items = group.records.flatMap(recordItems);
                const answered = items.filter((item) => Boolean(group.records.some((record) => record.answers[item.id]))).length;
                const ngCount = items.filter((item) => group.records.some((record) => record.answers[item.id] === "NG")).length;
                const allChecked = group.records.every((record) => record.approvalStatus === "checked");
                return (
                  <tr key={group.shift}>
                    <td><span className="table-page">{group.shift}</span></td>
                    <td><span className="operator-name"><UserRound size={15} />{operators}</span></td>
                    <td>{steps.map((area) => <span className="area-token" key={area}>{area}</span>)}</td>
                    <td>{months}</td>
                    <td><span className="progress-value">{answered}/{items.length}</span></td>
                    <td>{ngCount ? <span className="ng-badge"><TriangleAlert size={14} />{ngCount} NG</span> : <span className="empty-value">—</span>}</td>
                    <td><span className={`status-pill ${allChecked ? "completed" : "in-progress"}`}>{allChecked ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}{allChecked ? "Checked" : "Need review"}</span></td>
                    <td><button className="view-page" type="button" onClick={() => openGroup(group)}><Eye size={17} />View</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mock-note">Leading reviews all Operator entries for this line grouped per shift, and can edit them before approval.</p>
      </section>

      {selectedGroup && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedGroup(null); }}>
          <section className="review-detail review-detail-wide" role="dialog" aria-modal="true" aria-labelledby="review-detail-title">
            <button className="modal-close" type="button" onClick={() => setSelectedGroup(null)} aria-label="Close">×</button>
            <p className="eyebrow">OPERATOR SUBMISSION · {line}</p>
            <h2 id="review-detail-title">Checklist Results · {selectedGroup.shift}</h2>
            <div className="detail-meta">
              <span>Operators</span><strong>{[...new Set(selectedGroup.records.map((record) => record.operatorName))].join(", ")}</strong>
              <span>Shift</span><strong>{selectedGroup.shift}</strong>
              <span>Assigned steps</span><strong>{selectedGroup.records.flatMap((record) => record.assignedAreas).sort((left, right) => left - right).join(", ")}</strong>
            </div>

            <div className="review-accordion-list">
              {selectedGroup.records.flatMap((record) => record.assignedAreas).sort((left, right) => left - right).map((area) => {
                const record = areaRecord(selectedGroup, area);
                if (!record) return null;
                const station = AREA_STATIONS[area - 1];
                const forms = formsForArea(area);
                const items = forms.flatMap((form) => form.items);
                const answered = items.filter((item) => Boolean(record.answers[item.id])).length;
                const ngItems = items.filter((item) => record.answers[item.id] === "NG");
                const isOpen = open.has(area);
                const isEditing = editingAreas.has(area);
                return (
                  <div className={`review-accordion${isOpen ? " open" : ""}`} key={area}>
                    <button className="review-accordion-head" type="button" onClick={() => toggle(area)} aria-expanded={isOpen}>
                      <span className="table-page">{area}</span>
                      <span className="acc-copy"><strong>{station.name}</strong><small><UserRound size={13} />{record.operatorName} · {station.process}</small></span>
                      <span className="acc-meta">
                        <span className="progress-value">{answered}/{items.length} items</span>
                        {ngItems.length > 0 && <span className="ng-badge"><TriangleAlert size={14} />{ngItems.length} NG</span>}
                        <span className={`status-pill ${record.approvalStatus === "checked" ? "completed" : "in-progress"}`}>{record.approvalStatus === "checked" ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}{record.approvalStatus === "checked" ? "Checked" : "Need review"}</span>
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
                                const value = edits[item.id] ?? (record.answers[item.id] || "—");
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
