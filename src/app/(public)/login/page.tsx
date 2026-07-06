import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { ArenaLogo } from "@/shared/components/arena-logo";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--void)] p-6">
      <div className="mb-8">
        <ArenaLogo height={44} />
      </div>
      <Suspense fallback={<Loader2 className="w-8 h-8 text-[var(--flame)] animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
