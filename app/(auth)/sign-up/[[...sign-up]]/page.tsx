import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Maak je account aan
          </h1>
          <p className="text-slate-600">
            Start je gratis proefperiode van 1 maand
          </p>
        </div>
        <SignUp
          routing="hash"
          afterSignUpUrl="/onboarding/select-plan"
          afterSignInUrl="/dashboard"
        />
      </div>
    </div>
  );
}

