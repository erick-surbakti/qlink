"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Factory, Layers3, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrowserChecklistRecord, CHECKLIST_STORAGE_PREFIX } from "@/lib/mock-session";

const TOTAL_AREAS = 10;

function areaRange(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function AssignmentSelector() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role") === "leading" ? "leading" : "operator";
  const line = params.get("line") || "Mock Production Line";
  const [startArea, setStartArea] = useState(1);
  const [endArea, setEndArea] = useState(1);
  const [completedAreas, setCompletedAreas] = useState<number[]>([]);
  const selectedAreas = useMemo(() => areaRange(startArea, endArea), [endArea, startArea]);
  const hasCompletedArea = selectedAreas.some((area) => completedAreas.includes(area));

  useEffect(() => {
    const completed = new Set<number>();
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(CHECKLIST_STORAGE_PREFIX)) continue;
      try {
        const record = JSON.parse(window.localStorage.getItem(key) ?? "") as BrowserChecklistRecord;
        if (record.line === line && record.submissionStatus === "submitted") record.assignedAreas.forEach((area) => completed.add(area));
      } catch { /* Ignore malformed mock records. */ }
    }
    const values = [...completed].sort((left, right) => left - right);
    setCompletedAreas(values);
    const firstAvailable = Array.from({ length: TOTAL_AREAS }, (_, index) => index + 1).find((area) => !completed.has(area));
    if (firstAvailable) { setStartArea(firstAvailable); setEndArea(firstAvailable); }
  }, [line]);

  const chooseStart = (value: number) => {
    setStartArea(value);
    if (endArea < value) setEndArea(value);
  };

  const openChecklist = () => router.push(`/workspace?line=${encodeURIComponent(line)}&areas=${selectedAreas.join(",")}`);

  return <main className="shell"><section className="assignment-panel compact-assignment">
    <header className="verify-header">
      <Link href={`/verify?role=${role}`} className="back-button" aria-label="Back"><ArrowLeft size={22} /></Link>
      <div><p className="eyebrow">OPERATOR CHECKLIST · {line}</p><h1>Select Your Work Area</h1><p className="lead">Select the area range once, check its position, then open the checklist directly.</p></div>
    </header>

    <div className="assignment-combined">
      <div className="range-card">
        <div className="range-fields">
          <label><span>Start area</span><select value={startArea} onChange={(event) => chooseStart(Number(event.target.value))}>{Array.from({ length: TOTAL_AREAS }, (_, index) => index + 1).map((area) => <option value={area} disabled={completedAreas.includes(area)} key={area}>Area {area}{completedAreas.includes(area) ? " — submitted" : ""}</option>)}</select></label>
          <span className="range-arrow"><ArrowRight size={24} /></span>
          <label><span>End area</span><select value={endArea} onChange={(event) => setEndArea(Number(event.target.value))}>{Array.from({ length: TOTAL_AREAS - startArea + 1 }, (_, index) => startArea + index).map((area) => <option value={area} disabled={areaRange(startArea, area).some((value) => completedAreas.includes(value))} key={area}>Area {area}</option>)}</select></label>
        </div>
        <div className="selection-preview"><Layers3 size={22} /><span>Assigned area</span><strong>{startArea === endArea ? `Area ${startArea}` : `Areas ${startArea}-${endArea}`}</strong><small>{selectedAreas.length} of {TOTAL_AREAS} areas</small></div>
      </div>

      <div className="inline-u-confirm">
        <div className="u-line" aria-label="U-shaped production line">{Array.from({ length: TOTAL_AREAS }, (_, index) => index + 1).map((area) => <div className={`u-station station-${area}${selectedAreas.includes(area) ? " active" : ""}${completedAreas.includes(area) ? " submitted" : ""}`} key={area}><Factory size={17} /><span>{area}</span></div>)}</div>
        <p>Blue is your selection. Green areas were already submitted and cannot be selected again.</p>
      </div>
    </div>

    <button className="primary-button direct-checklist-button" type="button" disabled={hasCompletedArea || completedAreas.length === TOTAL_AREAS} onClick={openChecklist}><LockKeyhole size={18} />{completedAreas.length === TOTAL_AREAS ? "All areas already submitted" : "Confirm & open checklist"}<ArrowRight size={18} /></button>
  </section></main>;
}
