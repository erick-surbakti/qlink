"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, CreditCard, Factory, FilePenLine, LoaderCircle, Save, ScanLine, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChecklistForm, ChecklistItem, formsForArea } from "@/lib/mock-checklist";
import { BrowserChecklistRecord, CHECKLIST_STORAGE_PREFIX, checklistStorageKey } from "@/lib/mock-session";

type ScanState = "waiting" | "reading" | "verified";

function readLineRecords(line: string): BrowserChecklistRecord[] {
  const records: BrowserChecklistRecord[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(CHECKLIST_STORAGE_PREFIX)) continue;
    try {
      const record = JSON.parse(window.localStorage.getItem(key) ?? "") as BrowserChecklistRecord;
      if (record.id && record.line === line) records.push(record);
    } catch {
      // Ignore malformed mock entries without affecting other browser data.
    }
  }
  return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

const MOCK_USERS = {
  leading: { name: "Mock Leading User", employeeId: "L-0001", role: "Production Leading" },
  operator: { name: "Mock Operator User", employeeId: "O-0001", role: "Production Operator" },
} as const;

const PRODUCTION_LINES = [
  "CP1H Line #1",
  "CP2E Line #1",
  "E2B Final Line #1",
  "E2B Final Line #2",
  "E2B Line #1",
  "E2B Line #2",
  "E2B Water leak #1",
  "E3FA Line #1",
  "E3JK Line #1",
  "E3Z Back Assy #1",
  "E3Z Back Assy #2",
  "E3Z Back Assy #3",
  "E3Z Front Assy #1",
  "E3Z Front Assy #2",
  "E5CC Line #1",
  "E5CC Line #2",
  "H3CR Final Assy #1",
  "H3DK Line #1",
  "H3DS Line #1",
  "H3Y Line #1",
  "H5/7CX Line #1",
  "H7E Line #1",
  "S8VK Line #1",
] as const;

export default function VerifyCard() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedRole = params.get("role") === "leading" ? "leading" : "operator";
  const person = MOCK_USERS[selectedRole];
  const [state, setState] = useState<ScanState>("waiting");
  const [line, setLine] = useState("");
  const [editing, setEditing] = useState(false);
  const keyboardBuffer = useRef("");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roleLabel = useMemo(
    () => selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1),
    [selectedRole],
  );

  const verify = useCallback(() => {
    if (state !== "waiting" || !line) return;
    setState("reading");
    window.setTimeout(() => setState("verified"), 700);
  }, [line, state]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (state !== "waiting") return;
      if (event.key === "Enter") {
        if (keyboardBuffer.current.length >= 4) verify();
        keyboardBuffer.current = "";
        return;
      }
      if (event.key.length === 1) {
        keyboardBuffer.current += event.key;
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => { keyboardBuffer.current = ""; }, 300);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, [state, verify]);

  return (
    <main className="shell">
      <section className="verify-panel">
        <header className="verify-header">
          <Link href="/" className="back-button" aria-label="Back to role selection">
            <ArrowLeft size={22} />
          </Link>
          <div>
            <p className="eyebrow">{roleLabel} CHECKLIST</p>
            <h1>Verify Employee Card</h1>
            <p className="lead">Scan the employee RFID card to continue.</p>
          </div>
        </header>

        <div className={`scanner-card scanner-${state}`}>
          {state !== "verified" && (
            <label className="line-field">
              <span><Factory size={18} /> Production Line</span>
              <select value={line} onChange={(event) => setLine(event.target.value)} disabled={state !== "waiting"}>
                <option value="">Select production line…</option>
                {PRODUCTION_LINES.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </label>
          )}

          <div className="scanner-visual" aria-hidden="true">
            {state === "verified" ? <BadgeCheck size={48} /> : state === "reading" ? <LoaderCircle className="spin" size={48} /> : <ScanLine size={48} />}
          </div>

          {state === "waiting" && (
            <>
              <h2>Waiting for RFID scan</h2>
              <p>Place the card near the USB reader. The card number will not be displayed or stored in this mock.</p>
              <button className="primary-button" type="button" onClick={verify} disabled={!line}>
                <CreditCard size={20} /> Simulate RFID scan
              </button>
            </>
          )}

          {state === "reading" && (
            <>
              <h2>Verifying card…</h2>
              <p>Please keep the card near the reader.</p>
            </>
          )}

          {state === "verified" && (
            <>
              <h2>RFID verified</h2>
              <p className="verified-caption">Card identity confirmed. The RFID number remains hidden.</p>
              <dl className="identity-grid">
                <div><dt>Name</dt><dd>{person.name}</dd></div>
                <div><dt>Employee ID</dt><dd>{person.employeeId}</dd></div>
                <div><dt>Production Line</dt><dd>{line}</dd></div>
              </dl>
              <div className="verified-actions">
                <button className="secondary-button" type="button" onClick={() => setEditing(true)}><FilePenLine size={18} />Edit checklist data</button>
                <button className="secondary-button" type="button" onClick={() => setState("waiting")}>Scan another card</button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => router.push(
                    selectedRole === "leading"
                      ? `/review?line=${encodeURIComponent(line)}`
                      : `/assignment?role=${selectedRole}&line=${encodeURIComponent(line)}`,
                  )}
                >
                  {selectedRole === "leading" ? "Review operator checklist" : "Select checklist pages"} <ArrowRight size={19} />
                </button>
              </div>
            </>
          )}
        </div>

        <p className="privacy-note"><CreditCard size={16} /> RFID number is intentionally hidden to prevent card-data misuse.</p>
      </section>

      {editing && <EditWizard line={line} onClose={() => setEditing(false)} />}
    </main>
  );
}

function EditWizard({ line, onClose }: { line: string; onClose: () => void }) {
  const record = useMemo(() => readLineRecords(line)[0], [line]);
  const areas = record?.assignedAreas?.length ? record.assignedAreas : [1];
  const forms = useMemo(() => areas.flatMap(formsForArea), [areas]);
  const steps = useMemo(() => forms.flatMap((form) => form.items.map((item) => ({ form, item }))), [forms]);
  const [answers, setAnswers] = useState<Record<string, string>>(() => record?.answers ?? defaultMockAnswers(forms));
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const allAnswered = steps.every((entry) => Boolean(answers[entry.item.id]));

  const save = () => {
    if (!record) return onClose();
    const updated: BrowserChecklistRecord = { ...record, answers, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(checklistStorageKey(record.line, record.assignedAreas), JSON.stringify(updated));
    onClose();
  };

  if (!current) {
    return (
      <div className="modal-backdrop" role="presentation">
        <section className="wizard-modal" role="dialog" aria-modal="true">
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close"><X size={21} /></button>
          <p className="eyebrow">EDIT CHECKLIST DATA</p>
          <h2>No checklist data to edit</h2>
          <p className="lead">No Operator checklist record was found for <strong>{line}</strong>. Complete an Operator flow first, then edit its data here.</p>
          <div className="wizard-actions"><button className="primary-button" type="button" onClick={onClose}>Close</button></div>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="wizard-modal" role="dialog" aria-modal="true" aria-labelledby="edit-wizard-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close"><X size={21} /></button>
        <p className="eyebrow">EDIT CHECKLIST DATA · {current.form.frequency.toUpperCase()}</p>
        <h2 id="edit-wizard-title">{current.form.title}</h2>
        <div className="wizard-step-row">{steps.map((entry, index) => <button type="button" className={`${index === step ? "active " : ""}${answers[entry.item.id] ? "answered" : ""}`} onClick={() => setStep(index)} key={entry.item.id}>{index + 1}</button>)}</div>
        <div className="wizard-question">
          <span>Item {step + 1} of {steps.length}</span>
          <h3>{current.item.name}</h3>
          <div className="specification"><strong>Specification</strong><p>{current.item.specification}</p></div>
          <EditAnswerInput item={current.item} value={answers[current.item.id] ?? ""} onChange={(value) => setAnswers((prev) => ({ ...prev, [current.item.id]: value }))} />
        </div>
        <div className="wizard-actions">
          <button className="draft-button" type="button" onClick={save}><Save size={17} />Save changes</button>
          <div>
            <button className="secondary-button" type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>Previous</button>
            {!isLast && <button className="primary-button" type="button" disabled={!answers[current.item.id]} onClick={() => setStep(step + 1)}>Next<ArrowRight size={17} /></button>}
            {isLast && <button className="complete-button" type="button" disabled={!allAnswered} onClick={save}><Check size={17} />Save & close</button>}
          </div>
        </div>
      </section>
    </div>
  );
}

function defaultMockAnswers(forms: ChecklistForm[]): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const form of forms) {
    for (const item of form.items) {
      if (item.answerType === "choice") answers[item.id] = "OK";
      else if (item.answerType === "number") answers[item.id] = "42";
      else answers[item.id] = "Mock operator note for demonstration.";
    }
  }
  return answers;
}

function EditAnswerInput({ item, value, onChange }: { item: ChecklistItem; value: string; onChange: (value: string) => void }) {
  if (item.answerType === "choice") {
    return <div className="choice-grid">{["OK", "NG", "N/A"].map((choice) => <button type="button" className={value === choice ? "selected" : ""} onClick={() => onChange(choice)} key={choice}>{choice}</button>)}</div>;
  }
  if (item.answerType === "number") {
    return <label className="answer-field"><span>Measurement result</span><div><input type="number" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Enter value" /><em>{item.unit}</em></div></label>;
  }
  return <label className="answer-field"><span>Operator note</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="Describe the condition or abnormality..." /></label>;
}
