import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welkom terug
          </h1>
          <p className="text-slate-600">
            Log in op je EasyBoek account
          </p>
        </div>
        <SignIn
          routing="hash"
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/onboarding/select-plan"
        />
      </div>
    </div>
  );
}

