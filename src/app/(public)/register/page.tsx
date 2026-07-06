import { Suspense } from "react";
import { RegisterRedirect } from "./register-redirect";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loader2 className="w-8 h-8 text-[var(--flame)] animate-spin" />}>
      <RegisterRedirect />
    </Suspense>
  );
}
