"use client";

import { AREA_STATIONS, ChecklistForm, ChecklistItem, formsForArea } from "@/lib/mock-checklist";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList, Clock3, FileDown, Factory, Save, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StoredProgress = {
  answers: Record<string, string>;
  completedForms: string[];
};

function parseAreas(value: string | null) {
  const areas = (value ?? "1").split(",").map(Number).filter((number) => number >= 1 && number <= 10);
  return [...new Set(areas)].sort((left, right) => left - right);
}

export default function OperatorWorkspace() {
  const params = useSearchParams();
  const line = params.get("line") || "Mock Production Line";
  const assignedAreas = useMemo(() => parseAreas(params.get("areas")), [params]);
  const forms = useMemo(() => assignedAreas.flatMap(formsForArea), [assignedAreas]);
  const storageKey = useMemo(() => `q-link-checklist-mock:${line}:${assignedAreas.join("-")}`, [assignedAreas, line]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completedForms, setCompletedForms] = useState<string[]>([]);
  const [activeForm, setActiveForm] = useState<ChecklistForm | null>(null);
  const [step, setStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as StoredProgress;
        setAnswers(parsed.answers ?? {});
        setCompletedForms(parsed.completedForms ?? []);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    const progress: StoredProgress = { answers, completedForms };
    window.localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [answers, completedForms, hydrated, storageKey]);

  const openForm = (form: ChecklistForm) => {
    setActiveForm(form);
    const firstEmpty = form.items.findIndex((item) => !answers[item.id]);
    setStep(firstEmpty >= 0 ? firstEmpty : 0);
  };

  const formAnswered = (form: ChecklistForm) => form.items.filter((item) => Boolean(answers[item.id])).length;
  const allComplete = forms.length > 0 && forms.every((form) => completedForms.includes(form.id));

  return (
    <main className="workspace-shell">
      <section className="workspace-panel">
        <header className="workspace-header no-print">
          <Link href="/" className="back-button" aria-label="Back to role selection"><ArrowLeft size={22} /></Link>
          <div>
            <p className="eyebrow">OPERATOR DIGITAL CHECKLIST</p>
            <h1>Assigned Work Area</h1>
            <p className="lead"><Factory size={17} /> {line}</p>
          </div>
          <button className="pdf-button" type="button" onClick={() => window.print()} disabled={!allComplete}><FileDown size={18} />Generate PDF</button>
        </header>

        <div className="print-heading"><h1>Production Checklist Result</h1><p>{line}</p></div>

        <div className="access-banner no-print">
          <span><ClipboardList size={21} />You can only access the areas locked during assignment.</span>
          <strong>{assignedAreas.map((area) => `Area ${area}`).join(", ")}</strong>
        </div>

        <div className="workspace-progress no-print">
          <div><span>Completed forms</span><strong>{completedForms.length}/{forms.length}</strong></div>
          <div className="progress-track"><span style={{ width: `${forms.length ? (completedForms.length / forms.length) * 100 : 0}%` }} /></div>
          <small>{allComplete ? "All assigned forms are ready for PDF output." : "Forms can be completed in any order."}</small>
        </div>

        <div className="area-list">
          {assignedAreas.map((areaNumber) => {
            const area = AREA_STATIONS[areaNumber - 1];
            const areaForms = formsForArea(areaNumber);
            return (
              <section className="digital-area" key={areaNumber}>
                <header><span className="area-number">{areaNumber}</span><div><h2>{area.name}</h2><p>{area.process}</p></div></header>
                <div className="digital-form-grid">
                  {areaForms.map((form) => {
                    const answered = formAnswered(form);
                    const complete = completedForms.includes(form.id);
                    return (
                      <button className={`digital-form-card${complete ? " complete" : ""}`} type="button" key={form.id} onClick={() => openForm(form)}>
                        <span className="form-status-icon">{complete ? <CheckCircle2 /> : answered ? <Clock3 /> : <ClipboardList />}</span>
                        <span className="form-card-copy"><strong>{form.title}</strong><small>{form.frequency}</small><em>{answered}/{form.items.length} items filled</em></span>
                        <ArrowRight size={20} />
                      </button>
                    );
                  })}
                </div>

                <table className="print-result-table">
                  <thead><tr><th>Checklist</th><th>Item</th><th>Specification</th><th>Result</th></tr></thead>
                  <tbody>{areaForms.flatMap((form) => form.items.map((item) => <tr key={item.id}><td>{form.title}</td><td>{item.name}</td><td>{item.specification}</td><td>{answers[item.id] || "-"}</td></tr>))}</tbody>
                </table>
              </section>
            );
          })}
        </div>
      </section>

      {activeForm && (
        <ChecklistWizard
          form={activeForm}
          step={step}
          answers={answers}
          onAnswer={(item, value) => setAnswers((current) => ({ ...current, [item.id]: value }))}
          onStep={setStep}
          onClose={() => setActiveForm(null)}
          onSave={() => setActiveForm(null)}
          onComplete={() => {
            setCompletedForms((current) => current.includes(activeForm.id) ? current : [...current, activeForm.id]);
            setActiveForm(null);
          }}
        />
      )}
    </main>
  );
}

function ChecklistWizard({ form, step, answers, onAnswer, onStep, onClose, onSave, onComplete }: {
  form: ChecklistForm;
  step: number;
  answers: Record<string, string>;
  onAnswer: (item: ChecklistItem, value: string) => void;
  onStep: (step: number) => void;
  onClose: () => void;
  onSave: () => void;
  onComplete: () => void;
}) {
  const item = form.items[step];
  const isLast = step === form.items.length - 1;
  const allAnswered = form.items.every((entry) => Boolean(answers[entry.id]));

  return (
    <div className="modal-backdrop no-print" role="presentation">
      <section className="wizard-modal" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close"><X size={21} /></button>
        <p className="eyebrow">DIGITAL CHECKLIST · {form.frequency.toUpperCase()}</p>
        <h2 id="wizard-title">{form.title}</h2>
        <div className="wizard-step-row">{form.items.map((entry, index) => <button type="button" className={`${index === step ? "active " : ""}${answers[entry.id] ? "answered" : ""}`} onClick={() => onStep(index)} key={entry.id}>{index + 1}</button>)}</div>
        <div className="wizard-question">
          <span>Item {step + 1} of {form.items.length}</span>
          <h3>{item.name}</h3>
          <div className="specification"><strong>Specification</strong><p>{item.specification}</p></div>
          <AnswerInput item={item} value={answers[item.id] ?? ""} onChange={(value) => onAnswer(item, value)} />
        </div>
        <div className="wizard-actions">
          <button className="draft-button" type="button" onClick={onSave}><Save size={17} />Save draft</button>
          <div>
            <button className="secondary-button" type="button" disabled={step === 0} onClick={() => onStep(step - 1)}>Previous</button>
            {!isLast && <button className="primary-button" type="button" disabled={!answers[item.id]} onClick={() => onStep(step + 1)}>Next<ArrowRight size={17} /></button>}
            {isLast && <button className="complete-button" type="button" disabled={!allAnswered} onClick={onComplete}><Check size={17} />Complete form</button>}
          </div>
        </div>
      </section>
    </div>
  );
}

function AnswerInput({ item, value, onChange }: { item: ChecklistItem; value: string; onChange: (value: string) => void }) {
  if (item.answerType === "choice") {
    return <div className="choice-grid">{["OK", "NG", "N/A"].map((choice) => <button type="button" className={value === choice ? "selected" : ""} onClick={() => onChange(choice)} key={choice}>{choice}</button>)}</div>;
  }
  if (item.answerType === "number") {
    return <label className="answer-field"><span>Measurement result</span><div><input type="number" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Enter value" /><em>{item.unit}</em></div></label>;
  }
  return <label className="answer-field"><span>Operator note</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="Describe the condition or abnormality..." /></label>;
}
