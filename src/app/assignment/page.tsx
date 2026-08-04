import { Suspense } from "react";
import AssignmentSelector from "./assignment-selector";

export default function AssignmentPage() {
  return (
    <Suspense fallback={null}>
      <AssignmentSelector />
    </Suspense>
  );
}
