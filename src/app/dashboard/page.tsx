import { Suspense } from "react";
import ChecklistDashboard from "./checklist-dashboard";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <ChecklistDashboard />
    </Suspense>
  );
}
