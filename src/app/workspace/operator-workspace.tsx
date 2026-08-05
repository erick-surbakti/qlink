"use client";

import { AREA_STATIONS, ChecklistItem, formsForArea } from "@/lib/mock-checklist";
import { BrowserChecklistRecord, checklistStorageKey } from "@/lib/mock-session";
import { ArrowLeft, CheckCircle2, ClipboardList, Factory, LockKeyhole, Send } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function parseAreas(value: string | null) {
  const areas = (value ?? "1").split(",").map(Number).filter((number) => number >= 1 && number <= 10);
  return [...new Set(areas)].sort((left, right) => left - right);
}

export default function OperatorWorkspace() {
  const params = useSearchParams();
  const line = params.get("line") || "Mock Production Line";
  const assignedAreas = useMemo(() => parseAreas(params.get("areas")), [params]);
  const forms = useMemo(() => assignedAreas.flatMap(formsForArea), [assignedAreas]);
  const storageKey = useMemo(() => checklistStorageKey(line, assignedAreas), [assignedAreas, line]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completedForms, setCompletedForms] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as BrowserChecklistRecord;
        setAnswers(parsed.answers ?? {});
        setCompletedForms(parsed.completedForms ?? []);
        setSubmitted(parsed.submissionStatus === "submitted");
      } catch { window.localStorage.removeItem(storageKey); }
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    const completeIds = forms.filter((form) => form.items.every((item) => Boolean(answers[item.id]))).map((form) => form.id);
    if (completeIds.join("|") !== completedForms.join("|")) setCompletedForms(completeIds);
  }, [answers, completedForms, forms, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const existing = window.localStorage.getItem(storageKey);
    let previous: Partial<BrowserChecklistRecord> = {};
    try { previous = existing ? JSON.parse(existing) as BrowserChecklistRecord : {}; } catch { previous = {}; }
    const now = new Date();
    const progress: BrowserChecklistRecord = {
      id: previous.id ?? crypto.randomUUID(), line, assignedAreas, operatorName: "Mock Operator User",
      month: now.toISOString().slice(0, 7), answers, completedForms, updatedAt: now.toISOString(),
      submissionStatus: previous.submissionStatus ?? "draft", submittedAt: previous.submittedAt,
      approvalStatus: previous.approvalStatus ?? "pending", checkedAt: previous.checkedAt, checkedBy: previous.checkedBy,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [answers, assignedAreas, completedForms, hydrated, line, storageKey]);

  const allComplete = forms.length > 0 && completedForms.length === forms.length;
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const totalItems = forms.reduce((total, form) => total + form.items.length, 0);

  const submitAssignment = () => {
    if (!allComplete || submitted) return;
    const existing = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as Partial<BrowserChecklistRecord>;
    const now = new Date().toISOString();
    const record: BrowserChecklistRecord = {
      id: existing.id ?? crypto.randomUUID(), line, assignedAreas, operatorName: "Mock Operator User",
      month: now.slice(0, 7), answers, completedForms, updatedAt: now,
      submissionStatus: "submitted", submittedAt: now, approvalStatus: "pending",
    };
    window.localStorage.setItem(storageKey, JSON.stringify(record));
    setSubmitted(true);
  };

  return <main className="workspace-shell"><section className="workspace-panel simplified-workspace">
    <header className="workspace-header no-print">
      <Link href="/" className="back-button" aria-label="Back"><ArrowLeft size={22} /></Link>
      <div><p className="eyebrow">OPERATOR DIGITAL CHECKLIST</p><h1>Fill Checklist</h1><p className="lead"><Factory size={17} />{line} · Areas {assignedAreas.join(", ")}</p></div>
      <button className="operator-submit-button" type="button" onClick={submitAssignment} disabled={!allComplete || submitted}>{submitted ? <LockKeyhole size={18} /> : <Send size={18} />}{submitted ? "Submitted & locked" : "Submit my areas"}</button>
    </header>

    <div className="quick-progress no-print"><span><ClipboardList size={19} />Fill every result directly in the table. Changes save automatically.</span><strong>{answeredCount}/{totalItems} items</strong></div>
    <div className="progress-track no-print"><span style={{ width: `${totalItems ? (answeredCount / totalItems) * 100 : 0}%` }} /></div>

    <div className="compact-area-list">
      {assignedAreas.map((areaNumber) => {
        const area = AREA_STATIONS[areaNumber - 1];
        return <section className="compact-area" key={areaNumber}>
          <header><span className="area-number">{areaNumber}</span><div><h2>{area.name}</h2><p>{area.process}</p></div></header>
          {formsForArea(areaNumber).map((form) => {
            const complete = completedForms.includes(form.id);
            return <div className={`inline-checklist${complete ? " complete" : ""}`} key={form.id}>
              <div className="inline-checklist-title"><div><strong>{form.title}</strong><small>{form.frequency}</small></div>{complete && <span><CheckCircle2 size={16} />Complete</span>}</div>
              <div className="inline-table-wrap"><table><thead><tr><th>Item</th><th>Specification</th><th>Action / Result</th></tr></thead><tbody>{form.items.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.specification}</td><td><InlineAnswer item={item} value={answers[item.id] ?? ""} disabled={submitted} onChange={(value) => setAnswers((current) => ({ ...current, [item.id]: value }))} /></td></tr>)}</tbody></table></div>
            </div>;
          })}
        </section>;
      })}
    </div>
    <footer className={`autosave-footer no-print${allComplete ? " complete" : ""}`}><span>{submitted ? <LockKeyhole size={20} /> : allComplete ? <CheckCircle2 size={20} /> : <ClipboardList size={20} />}</span><div><strong>{submitted ? "Your assigned areas have been submitted" : allComplete ? "Ready to submit" : "Draft saved automatically"}</strong><small>{submitted ? "These areas are locked. Another Operator can continue the remaining areas on this line." : allComplete ? "Submit once to hand your areas over to Leading." : "Continue filling the empty rows—no Next button is required."}</small></div></footer>
  </section></main>;
}

function InlineAnswer({ item, value, disabled, onChange }: { item: ChecklistItem; value: string; disabled: boolean; onChange: (value: string) => void }) {
  if (item.answerType === "choice") return <div className="inline-choice"><button disabled={disabled} className={value === "OK" ? "selected ok" : ""} type="button" onClick={() => onChange("OK")}>OK</button><button disabled={disabled} className={value === "NG" ? "selected ng" : ""} type="button" onClick={() => onChange("NG")}>NG</button></div>;
  if (item.answerType === "number") return <label className="inline-number"><input disabled={disabled} type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder="0" /><span>{item.unit}</span></label>;
  return <input disabled={disabled} className="inline-text" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Type note only if needed" />;
}
