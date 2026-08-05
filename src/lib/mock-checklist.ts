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

export type AreaStation = {
  number: number;
  name: string;
  process: string;
};

export const AREA_STATIONS: AreaStation[] = [
  { number: 1, name: "Input Material", process: "Material preparation" },
  { number: 2, name: "Pre-Assembly", process: "Component readiness" },
  { number: 3, name: "Assembly 1", process: "Initial assembly" },
  { number: 4, name: "Assembly 2", process: "Main assembly" },
  { number: 5, name: "Adjustment", process: "Parameter adjustment" },
  { number: 6, name: "Inspection 1", process: "Visual inspection" },
  { number: 7, name: "Inspection 2", process: "Functional inspection" },
  { number: 8, name: "Final Check", process: "Final verification" },
  { number: 9, name: "Packing", process: "Packing confirmation" },
  { number: 10, name: "Output", process: "Output and handover" },
];

const safetyItems: ChecklistItem[] = [
  { id: "esd-shoes", name: "ESD shoes condition", specification: "Clean, undamaged, and used correctly", answerType: "choice" },
  { id: "work-area", name: "Working area", specification: "No foreign material and no obstruction", answerType: "choice" },
  { id: "temperature", name: "Temperature", specification: "20 - 25 °C", answerType: "number", unit: "°C" },
  { id: "humidity", name: "Humidity", specification: "30 - 75 %", answerType: "number", unit: "%" },
  { id: "lighting", name: "Lighting condition", specification: "No blinking", answerType: "choice" },
];

const processItems: ChecklistItem[] = [
  { id: "machine-condition", name: "Machine condition", specification: "No abnormal sound, vibration, or leakage", answerType: "choice" },
  { id: "jig-condition", name: "Jig and tool condition", specification: "Available, clean, and not damaged", answerType: "choice" },
  { id: "process-value", name: "Process measurement", specification: "Follow the approved process standard", answerType: "number", unit: "unit" },
  { id: "operator-note", name: "Operator note", specification: "Add a note when an abnormality is found", answerType: "text" },
];

const qualityItems: ChecklistItem[] = [
  { id: "sample-condition", name: "Sample condition", specification: "Matches the approved reference sample", answerType: "choice" },
  { id: "appearance", name: "Product appearance", specification: "No scratch, dent, contamination, or deformation", answerType: "choice" },
  { id: "critical-point", name: "Critical quality point", specification: "Result is within the control specification", answerType: "choice" },
];

export function formsForArea(areaNumber: number): ChecklistForm[] {
  const area = AREA_STATIONS.find((item) => item.number === areaNumber) ?? AREA_STATIONS[0];
  return [
    {
      id: `area-${areaNumber}-startup`,
      title: `${area.name} - Start-up Check`,
      frequency: "Start of shift",
      items: safetyItems.map((item) => ({ ...item, id: `a${areaNumber}-startup-${item.id}` })),
    },
    {
      id: `area-${areaNumber}-process`,
      title: `${area.name} - Process Check`,
      frequency: "Daily",
      items: processItems.map((item) => ({ ...item, id: `a${areaNumber}-process-${item.id}` })),
    },
    {
      id: `area-${areaNumber}-quality`,
      title: `${area.name} - Quality Check`,
      frequency: "Daily",
      items: qualityItems.map((item) => ({ ...item, id: `a${areaNumber}-quality-${item.id}` })),
    },
  ];
}
