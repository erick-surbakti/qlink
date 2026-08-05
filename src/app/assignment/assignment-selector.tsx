"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Factory, Layers3, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

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
  const selectedAreas = useMemo(() => areaRange(startArea, endArea), [endArea, startArea]);

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
          <label><span>Start area</span><select value={startArea} onChange={(event) => chooseStart(Number(event.target.value))}>{Array.from({ length: TOTAL_AREAS }, (_, index) => index + 1).map((area) => <option value={area} key={area}>Area {area}</option>)}</select></label>
          <span className="range-arrow"><ArrowRight size={24} /></span>
          <label><span>End area</span><select value={endArea} onChange={(event) => setEndArea(Number(event.target.value))}>{Array.from({ length: TOTAL_AREAS - startArea + 1 }, (_, index) => startArea + index).map((area) => <option value={area} key={area}>Area {area}</option>)}</select></label>
        </div>
        <div className="selection-preview"><Layers3 size={22} /><span>Assigned area</span><strong>{startArea === endArea ? `Area ${startArea}` : `Areas ${startArea}-${endArea}`}</strong><small>{selectedAreas.length} of {TOTAL_AREAS} areas</small></div>
      </div>

      <div className="inline-u-confirm">
        <div className="u-line" aria-label="U-shaped production line">{Array.from({ length: TOTAL_AREAS }, (_, index) => index + 1).map((area) => <div className={`u-station station-${area}${selectedAreas.includes(area) ? " active" : ""}`} key={area}><Factory size={17} /><span>{area}</span></div>)}</div>
        <p>Your selected responsibility is highlighted. It cannot be changed after opening the checklist.</p>
      </div>
    </div>

    <button className="primary-button direct-checklist-button" type="button" onClick={openChecklist}><LockKeyhole size={18} />Confirm & open checklist<ArrowRight size={18} /></button>
  </section></main>;
}
