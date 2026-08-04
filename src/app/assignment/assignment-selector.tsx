"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Factory, Layers3, LockKeyhole, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

const TOTAL_PAGES = 10;

function pageRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function AssignmentSelector() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role") === "leading" ? "leading" : "operator";
  const line = params.get("line") || "Mock Production Line";
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [locked, setLocked] = useState(false);
  const selectedPages = useMemo(() => pageRange(startPage, endPage), [endPage, startPage]);

  const chooseStart = (value: number) => {
    setStartPage(value);
    if (endPage < value) setEndPage(value);
  };

  if (locked) {
    return (
      <main className="shell">
        <section className="assignment-panel assigned-result">
          <span className="success-icon"><Check size={42} /></span>
          <p className="eyebrow">ASSIGNMENT LOCKED</p>
          <h1>Checklist area confirmed</h1>
          <p className="lead">Your checklist assignment has been fixed and can no longer be changed.</p>
          <div className="assignment-summary">
            <div><span>Role</span><strong>{role === "leading" ? "Leading" : "Operator"}</strong></div>
            <div><span>Production Line</span><strong>{line}</strong></div>
            <div><span>Assigned Areas</span><strong>{startPage === endPage ? `Area ${startPage}` : `Areas ${startPage}-${endPage}`}</strong></div>
          </div>
          <button className="primary-button" type="button" onClick={() => router.push(`/workspace?line=${encodeURIComponent(line)}&areas=${selectedPages.join(",")}`)}>
            Open assigned checklist <ArrowRight size={18} />
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="assignment-panel">
        <header className="verify-header">
          <Link href={`/verify?role=${role}`} className="back-button" aria-label="Back to RFID verification"><ArrowLeft size={22} /></Link>
          <div>
            <p className="eyebrow">{role.toUpperCase()} CHECKLIST · {line}</p>
            <h1>Select Checklist Area</h1>
            <p className="lead">Choose the first and last U-line area you will handle. Only these areas will be accessible.</p>
          </div>
        </header>

        <div className="range-card">
          <div className="range-fields">
            <label>
              <span>Start area</span>
              <select value={startPage} onChange={(event) => chooseStart(Number(event.target.value))}>
                {Array.from({ length: TOTAL_PAGES }, (_, index) => index + 1).map((page) => <option value={page} key={page}>Area {page}</option>)}
              </select>
            </label>
            <span className="range-arrow"><ArrowRight size={24} /></span>
            <label>
              <span>End area</span>
              <select value={endPage} onChange={(event) => setEndPage(Number(event.target.value))}>
                {Array.from({ length: TOTAL_PAGES - startPage + 1 }, (_, index) => startPage + index).map((page) => <option value={page} key={page}>Area {page}</option>)}
              </select>
            </label>
          </div>

          <div className="selection-preview">
            <Layers3 size={22} />
            <span>You selected</span>
            <strong>{startPage === endPage ? `Area ${startPage}` : `Areas ${startPage}-${endPage}`}</strong>
            <small>{selectedPages.length} of {TOTAL_PAGES} U-line areas</small>
          </div>
        </div>

        <div className="page-strip" aria-label="Selected U-line areas">
          {Array.from({ length: TOTAL_PAGES }, (_, index) => index + 1).map((page) => (
            <span className={selectedPages.includes(page) ? "page-chip selected" : "page-chip"} key={page}>{page}</span>
          ))}
        </div>

        <button className="primary-button assignment-next" type="button" onClick={() => setConfirming(true)}>
          Next <ArrowRight size={19} />
        </button>
      </section>

      {confirming && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirming(false); }}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <button className="modal-close" type="button" onClick={() => setConfirming(false)} aria-label="Close"><X size={21} /></button>
            <span className="warning-icon"><AlertTriangle size={30} /></span>
            <p className="eyebrow">FINAL CONFIRMATION</p>
            <h2 id="confirm-title">Are you sure about this area?</h2>
            <p>After confirmation, you cannot return and change the assigned work areas.</p>

            <div className="u-line-wrap">
              <div className="u-line" aria-label="U-shaped production line assignment">
                {Array.from({ length: TOTAL_PAGES }, (_, index) => index + 1).map((page) => (
                  <div
                    className={`u-station station-${page}${selectedPages.includes(page) ? " active" : ""}`}
                    key={page}
                  >
                    <Factory size={17} />
                    <span>{page}</span>
                  </div>
                ))}
              </div>
              <p><span className="pulse-dot" /> Your responsibility is highlighted on the U-shaped line.</p>
            </div>

            <div className="modal-selection"><strong>{startPage === endPage ? `Area ${startPage}` : `Areas ${startPage}-${endPage}`}</strong><span>{line}</span></div>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setConfirming(false)}>Review again</button>
              <button className="danger-confirm" type="button" onClick={() => { setConfirming(false); setLocked(true); }}><LockKeyhole size={18} /> Confirm & lock</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
