"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, Factory, TriangleAlert, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AREA_STATIONS, formsForArea } from "@/lib/mock-checklist";
import { BrowserChecklistRecord, buildMockSubmittedRecord, CHECKLIST_STORAGE_PREFIX } from "@/lib/mock-session";

const TOTAL_AREAS = 10;

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

export default function OperatorChecklistReview() {
  const router = useRouter();
  const params = useSearchParams();
  const line = params.get("line") || "Mock Production Line";

  const records = useMemo(() => {
    const found = readSubmittedRecords(line);
    if (found.length) return found;
    const mock = buildMockSubmittedRecord(line, [1, 2]);
    mock.answers["a1-quality-sample-condition"] = "NG";
    return [mock];
  }, [line]);

  const areaRecords = useMemo(() => {
    const map = new Map<number, BrowserChecklistRecord>();
    for (const record of records) {
      for (const area of record.assignedAreas) map.set(area, record);
    }
    return map;
  }, [records]);

  const submittedAreas = useMemo(() => [...areaRecords.keys()].sort((left, right) => left - right), [areaRecords]);
  const [open, setOpen] = useState<Set<number>>(() => new Set(submittedAreas.slice(0, 1)));

  const toggle = (area: number) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(area)) next.delete(area);
      else next.add(area);
      return next;
    });
  };

  const checkedCount = submittedAreas.filter((area) => areaRecords.get(area)?.approvalStatus === "checked").length;
  const awaitingCount = submittedAreas.length - checkedCount;

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
          <div><CheckCircle2 /><span><strong>{checkedCount}</strong>Approved areas</span></div>
          <div><Clock3 /><span><strong>{awaitingCount}</strong>Awaiting review</span></div>
          <div><ClipboardCheck /><span><strong>{submittedAreas.length}</strong>Submitted steps</span></div>
        </div>

        <div className="review-accordion-list">
          {submittedAreas.map((area) => {
            const record = areaRecords.get(area)!;
            const station = AREA_STATIONS[area - 1];
            const forms = formsForArea(area);
            const items = forms.flatMap((form) => form.items);
            const answered = items.filter((item) => Boolean(record.answers[item.id])).length;
            const ngItems = items.filter((item) => record.answers[item.id] === "NG");
            const isOpen = open.has(area);
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
                    <div className="review-table-wrap">
                      <table className="review-table review-area-table">
                        <thead><tr><th>Checklist</th><th>Item check</th><th>Specification</th><th>Result</th></tr></thead>
                        <tbody>
                          {forms.flatMap((form) => form.items.map((item) => {
                            const value = record.answers[item.id] || "—";
                            const isNg = value === "NG";
                            return <tr key={item.id}><td>{form.title}</td><td><strong>{item.name}</strong></td><td>{item.specification}</td><td>{isNg ? <span className="result-ng">NG</span> : <span className="result-value">{value}</span>}</td></tr>;
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

        <p className="mock-note">Leading is read-only in this prototype and reviews checklist areas submitted by Operators.</p>
      </section>
    </main>
  );
}
