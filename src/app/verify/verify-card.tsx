"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, Factory, LoaderCircle, ScanLine } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ScanState = "waiting" | "reading";

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
  const [state, setState] = useState<ScanState>("waiting");
  const [line, setLine] = useState("");
  const keyboardBuffer = useRef("");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roleLabel = useMemo(
    () => selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1),
    [selectedRole],
  );

  const nextPath = useCallback(() => selectedRole === "leading"
    ? `/dashboard?line=${encodeURIComponent(line)}`
    : `/assignment?role=${selectedRole}&line=${encodeURIComponent(line)}`, [line, selectedRole]);

  const verify = useCallback(() => {
    if (state !== "waiting" || !line) return;
    setState("reading");
    window.setTimeout(() => router.push(nextPath()), 450);
  }, [line, nextPath, router, state]);

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
          <label className="line-field">
              <span><Factory size={18} /> Production Line</span>
              <select value={line} onChange={(event) => setLine(event.target.value)} disabled={state !== "waiting"}>
                <option value="">Select production line…</option>
                {PRODUCTION_LINES.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
          </label>

          <div className="scanner-visual" aria-hidden="true">
            {state === "reading" ? <LoaderCircle className="spin" size={48} /> : <ScanLine size={48} />}
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

        </div>

        <p className="privacy-note"><CreditCard size={16} /> RFID number is intentionally hidden to prevent card-data misuse.</p>
      </section>
    </main>
  );
}
