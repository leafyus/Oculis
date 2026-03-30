import { Suspense } from "react";
import SignInForm from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}
