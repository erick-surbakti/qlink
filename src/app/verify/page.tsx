import { Suspense } from "react";
import VerifyCard from "./verify-card";

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyCard />
    </Suspense>
  );
}
