import { formsForArea } from "./mock-checklist";

export const CHECKLIST_STORAGE_PREFIX = "q-link-checklist-mock:record:";

export type BrowserChecklistRecord = {
  id: string;
  line: string;
  assignedAreas: number[];
  operatorName: string;
  month: string;
  answers: Record<string, string>;
  completedForms: string[];
  updatedAt: string;
  submissionStatus?: "draft" | "submitted";
  submittedAt?: string;
  approvalStatus: "pending" | "checked";
  checkedAt?: string;
  checkedBy?: string;
};

export function checklistStorageKey(line: string, assignedAreas: number[]) {
  const identity = `${line}:${assignedAreas.join("-")}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${CHECKLIST_STORAGE_PREFIX}${identity}`;
}

export function buildMockSubmittedRecord(line: string, assignedAreas: number[]): BrowserChecklistRecord {
  const forms = assignedAreas.flatMap(formsForArea);
  const answers: Record<string, string> = {};
  for (const form of forms) {
    for (const item of form.items) {
      answers[item.id] = item.answerType === "number" ? "42" : item.answerType === "text" ? "Mock operator note." : "OK";
    }
  }
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    line,
    assignedAreas,
    operatorName: "Mock Operator User",
    month: now.slice(0, 7),
    answers,
    completedForms: forms.map((form) => form.id),
    updatedAt: now,
    submissionStatus: "submitted",
    submittedAt: now,
    approvalStatus: "pending",
  };
}
