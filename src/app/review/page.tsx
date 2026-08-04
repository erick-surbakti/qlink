import { Suspense } from "react";
import OperatorChecklistReview from "./operator-checklist-review";

export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <OperatorChecklistReview />
    </Suspense>
  );
}
