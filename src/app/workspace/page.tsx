import { Suspense } from "react";
import OperatorWorkspace from "./operator-workspace";

export default function WorkspacePage() {
  return (
    <Suspense fallback={null}>
      <OperatorWorkspace />
    </Suspense>
  );
}
