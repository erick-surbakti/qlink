export type AnswerType = "choice" | "number" | "text";

export type ChecklistItem = {
  id: string;
  name: string;
  specification: string;
  answerType: AnswerType;
  unit?: string;
};

export type ChecklistForm = {
  id: string;
  title: string;
  frequency: string;
  items: ChecklistItem[];
};

export type ChecklistDocument = {
  number: number;
  name: string;
  process: string;
  sourcePage: number;
  items: ChecklistItem[];
};

const choice = (id: string, name: string, specification: string): ChecklistItem => ({ id, name, specification, answerType: "choice" });
const number = (id: string, name: string, specification: string, unit: string): ChecklistItem => ({ id, name, specification, answerType: "number", unit });

const torqueItems = (prefix: string): ChecklistItem[] => [
  number(`${prefix}-torque-a`, "Torque strength A", "Follow the approved model specification", "N·m"),
  number(`${prefix}-torque-b`, "Torque strength B", "Measure twice per shift", "N·m"),
  choice(`${prefix}-screw`, "Screw condition", "No looseness, damage, or missing screw"),
];

export const S8VK_CHECKLIST_DOCUMENTS: ChecklistDocument[] = [
  { number: 1, sourcePage: 1, name: "Daily Checklist S8VK — Visual & Machine", process: "S8VK main daily inspection", items: [choice("visual", "Appearance", "No scratch, deformation, contamination, or missing part"), choice("machine", "Machine condition", "No abnormal sound or condition"), choice("sample", "Reference sample", "Matches the approved sample")] },
  { number: 2, sourcePage: 2, name: "Daily Checklist S8VK — Process Condition", process: "S8VK production condition", items: [choice("jig", "Jig and fixture", "Clean, complete, and undamaged"), choice("wire", "Wire and terminal", "No loose or damaged wire"), choice("solder", "Solder appearance", "No bridge, splash, or insufficient solder")] },
  { number: 3, sourcePage: 3, name: "Daily Checklist S8VK — Quality Point", process: "S8VK quality confirmation", items: [choice("label", "Label condition", "Correct model, position, and readability"), choice("terminal", "Terminal condition", "No deformation or looseness"), choice("final", "Final appearance", "Conforms to approved appearance standard")] },
  { number: 4, sourcePage: 4, name: "S8VK-G — Torque Strength Check A", process: "Twice-per-shift torque inspection", items: torqueItems("p4") },
  { number: 5, sourcePage: 5, name: "S8VK-G — Torque Strength Check B", process: "Twice-per-shift torque inspection", items: torqueItems("p5") },
  { number: 6, sourcePage: 6, name: "S8VK-G — Jig Appearance Check", process: "Jig condition and visual confirmation", items: [choice("p6-jig", "Jig appearance", "No damage, contamination, or missing part"), choice("p6-position", "Part positioning", "Part is seated in the correct position"), choice("p6-marker", "Visual marker", "Marker and reference points are visible") ] },
  { number: 7, sourcePage: 7, name: "S8VK-C — PJG Soldering", process: "PJG auto solder machine", items: [number("p7-temp-a", "Solder temperature A", "370–390", "°C"), number("p7-temp-b", "Solder temperature B", "370–390", "°C"), number("p7-voltage", "Drain voltage", "Within approved standard", "mV"), number("p7-resistance", "Resistance", "Within approved standard", "Ω"), choice("p7-appearance", "Solder appearance", "No bridge, splash, or insufficient solder") ] },
  { number: 8, sourcePage: 8, name: "S8VK-G — Air Pressure Check A", process: "Air-pressure verification", items: [number("p8-air", "Air pressure", "0.1–0.3", "MPa"), choice("p8-gauge", "Pressure gauge", "Gauge is readable and stable")] },
  { number: 9, sourcePage: 9, name: "S8VK-G — Air Pressure Check B", process: "Air-pressure verification", items: [number("p9-air", "Air pressure", "0.1–0.3", "MPa"), choice("p9-gauge", "Pressure gauge", "Gauge is readable and stable")] },
  { number: 10, sourcePage: 10, name: "S8VK-G — Air Pressure Check C", process: "Air-pressure verification", items: [number("p10-air", "Air pressure", "0.1–0.3", "MPa"), choice("p10-gauge", "Pressure gauge", "Gauge is readable and stable")] },
  { number: 11, sourcePage: 11, name: "S8VK-G — Torque Strength Check C", process: "Twice-per-shift torque inspection", items: torqueItems("p11") },
  { number: 12, sourcePage: 12, name: "S8VK-G — PJG Connector Soldering", process: "PJG connector solder machine", items: [number("p12-temp-a", "Solder temperature A", "370–390", "°C"), number("p12-temp-b", "Solder temperature B", "370–390", "°C"), number("p12-voltage", "Drain voltage", "Within approved standard", "mV"), number("p12-resistance", "Resistance", "Within approved standard", "Ω"), choice("p12-appearance", "Connector solder appearance", "No bridge, splash, or insufficient solder") ] },
  { number: 13, sourcePage: 13, name: "S8VK-G — Torque Strength Check D", process: "Twice-per-shift torque inspection", items: torqueItems("p13") },
  { number: 14, sourcePage: 14, name: "S8VK-G — Torque Strength Check E", process: "Twice-per-shift torque inspection", items: torqueItems("p14") },
  { number: 15, sourcePage: 15, name: "Daily 5S Checklist", process: "Production-line 5S inspection", items: [choice("p15-sort", "Sort", "Unnecessary items are removed"), choice("p15-set", "Set in order", "Tools and materials are in assigned locations"), choice("p15-shine", "Shine", "Workplace and equipment are clean"), choice("p15-standardize", "Standardize", "Visual standards are followed"), choice("p15-sustain", "Sustain", "5S condition is maintained") ] },
  { number: 16, sourcePage: 16, name: "S8VK-G — Screw Thermal Block", process: "Thermal-block screw inspection", items: [number("p16-torque", "Screw torque strength", "Follow approved specification", "N·m"), choice("p16-lock", "Thermal block lock", "Secure, complete, and undamaged"), choice("p16-screw", "Screw appearance", "No looseness, damage, or missing screw") ] },
];

const GENERIC_DOCUMENTS = S8VK_CHECKLIST_DOCUMENTS.slice(0, 10).map((document, index) => ({
  ...document,
  number: index + 1,
  sourcePage: index + 1,
  name: `Production Checklist Document ${index + 1}`,
  process: "Mock checklist for the selected production line",
}));

export function documentsForLine(line: string): ChecklistDocument[] {
  return line.toUpperCase().includes("S8VK") ? S8VK_CHECKLIST_DOCUMENTS : GENERIC_DOCUMENTS;
}

export function formsForDocument(documentNumber: number, line = "S8VK Line #1"): ChecklistForm[] {
  const document = documentsForLine(line).find((item) => item.number === documentNumber) ?? documentsForLine(line)[0];
  return [{
    id: `document-${document.number}`,
    title: document.name,
    frequency: document.process,
    items: document.items.map((item) => ({ ...item, id: `d${document.number}-${item.id}` })),
  }];
}

// Compatibility exports for the existing mock dashboard while records migrate
// from physical areas to independently selectable checklist documents.
export const AREA_STATIONS = S8VK_CHECKLIST_DOCUMENTS;
export function formsForArea(documentNumber: number): ChecklistForm[] {
  return formsForDocument(documentNumber);
}
