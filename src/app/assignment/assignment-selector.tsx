"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ClipboardList, FileText, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { documentsForLine } from "@/lib/mock-checklist";
import { BrowserChecklistRecord, CHECKLIST_STORAGE_PREFIX } from "@/lib/mock-session";

export default function AssignmentSelector() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get("role") === "leading" ? "leading" : "operator";
  const line = params.get("line") || "Mock Production Line";
  const documents = useMemo(() => documentsForLine(line), [line]);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [completedDocuments, setCompletedDocuments] = useState<number[]>([]);
  const [previewDocument, setPreviewDocument] = useState(documents[0]?.number ?? 1);

  useEffect(() => {
    const completed = new Set<number>();
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(CHECKLIST_STORAGE_PREFIX)) continue;
      try {
        const record = JSON.parse(window.localStorage.getItem(key) ?? "") as BrowserChecklistRecord;
        if (record.line === line && record.submissionStatus === "submitted") record.assignedAreas.forEach((document) => completed.add(document));
      } catch { /* Ignore malformed mock records. */ }
    }
    setCompletedDocuments([...completed].sort((left, right) => left - right));
    const firstAvailable = documents.find((document) => !completed.has(document.number));
    setSelectedDocuments(firstAvailable ? [firstAvailable.number] : []);
    setPreviewDocument(firstAvailable?.number ?? documents[0]?.number ?? 1);
  }, [documents, line]);

  const toggleDocument = (documentNumber: number) => {
    if (completedDocuments.includes(documentNumber)) return;
    setPreviewDocument(documentNumber);
    setSelectedDocuments((current) => current.includes(documentNumber)
      ? current.filter((value) => value !== documentNumber)
      : [...current, documentNumber].sort((left, right) => left - right));
  };

  const preview = documents.find((document) => document.number === previewDocument) ?? documents[0];
  const openChecklist = () => router.push(`/workspace?line=${encodeURIComponent(line)}&areas=${selectedDocuments.join(",")}`);

  return <main className="shell"><section className="assignment-panel document-assignment-panel">
    <header className="verify-header">
      <Link href={`/verify?role=${role}`} className="back-button" aria-label="Back"><ArrowLeft size={22} /></Link>
      <div><p className="eyebrow">OPERATOR CHECKLIST · {line}</p><h1>Pilih Dokumen Checklist</h1><p className="lead">Pilih satu atau beberapa dokumen yang akan dikerjakan. Dokumen tidak harus berurutan.</p></div>
    </header>

    <div className="document-assignment-layout">
      <div className="document-picker-panel">
        <div className="document-picker-heading"><div><ClipboardList size={21} /><strong>Dokumen untuk line ini</strong></div><span>{selectedDocuments.length} dipilih</span></div>
        <div className="document-option-list">{documents.map((document) => {
          const selected = selectedDocuments.includes(document.number);
          const completed = completedDocuments.includes(document.number);
          return <button type="button" className={`document-option${selected ? " selected" : ""}${completed ? " completed" : ""}`} disabled={completed} onClick={() => toggleDocument(document.number)} key={document.number}>
            <span className="document-check">{completed || selected ? <Check size={17} /> : document.number}</span>
            <span><strong>{document.name}</strong><small>{document.process}</small></span>
            <em>{completed ? "Submitted" : `Page ${document.sourcePage}`}</em>
          </button>;
        })}</div>
      </div>

      <aside className="document-preview-panel">
        <div className="document-preview-head"><FileText size={24} /><div><span>Preview pekerjaan Operator</span><strong>{preview?.name}</strong></div></div>
        {preview && <>
          <div className="paper-preview"><div className="paper-preview-title"><strong>{preview.name}</strong><small>{line} · Source page {preview.sourcePage}</small></div><table><thead><tr><th>Item</th><th>Specification</th><th>Result</th></tr></thead><tbody>{preview.items.slice(0, 6).map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.specification}</td><td>{item.answerType === "choice" ? "OK / NG" : item.unit || "Input"}</td></tr>)}</tbody></table></div>
          <p>Preview menampilkan item yang akan diisi. Klik dokumen lain untuk melihat isinya sebelum memilih.</p>
        </>}
      </aside>
    </div>

    <button className="primary-button direct-checklist-button" type="button" disabled={!selectedDocuments.length} onClick={openChecklist}><LockKeyhole size={18} />{completedDocuments.length === documents.length ? "Semua dokumen sudah submitted" : `Buka ${selectedDocuments.length} dokumen terpilih`}<ArrowRight size={18} /></button>
  </section></main>;
}
