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
  approvalStatus: "pending" | "checked";
  checkedAt?: string;
  checkedBy?: string;
};

export function checklistStorageKey(line: string, assignedAreas: number[]) {
  const identity = `${line}:${assignedAreas.join("-")}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${CHECKLIST_STORAGE_PREFIX}${identity}`;
}
