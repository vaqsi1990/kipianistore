"use client"
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export default function CredentialsForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.signIn");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: callbackUrl || "/",
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error === "CredentialsSignin" ? t("invalidCredentials") : result.error);
    } else if (result?.ok && result.url) {
      router.push(result.url);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");
    await signIn("google", { callbackUrl: callbackUrl || "/" });
    setGoogleLoading(false);
  }

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-lg font-semibold text-white bg-[#869dab] rounded-lg hover:bg-[#357ae8] transition-colors"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.36 30.18 0 24 0 14.82 0 6.71 5.48 2.69 13.44l7.98 6.2C12.13 13.09 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.03l7.19 5.59C43.93 37.13 46.1 31.36 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.13a14.5 14.5 0 010-8.26l-7.98-6.2A23.94 23.94 0 000 24c0 3.77.9 7.34 2.69 10.56l7.98-6.43z"/><path fill="#EA4335" d="M24 48c6.18 0 11.36-2.05 15.15-5.57l-7.19-5.59c-2.01 1.35-4.59 2.15-7.96 2.15-6.38 0-11.87-3.59-14.33-8.77l-7.98 6.43C6.71 42.52 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
          )}
          {t("signInWithGoogle") || "Sign in with Google"}
        </Button>
      </div>
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-6">
          <div>
            <Label className="text-[18px] font-bold" htmlFor="email">{t("email")}</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              required 
              autoComplete="email" 
              placeholder={t("emailPlaceholder")}
            />
          </div>
          <div>
            <Label className="text-[18px] font-bold" htmlFor="password">{t("password")}</Label>
            <PasswordInput 
              id="password" 
              name="password" 
              required 
              autoComplete="current-password" 
              placeholder={t("passwordPlaceholder")}
            />
            <div className="text-right mt-2">
              <Link 
                href="/forgot-password" 
                className="text-[18px] font-bold "
              >
                {t("forgotPassword")}
              </Link>
            </div>
          </div>
          <div>
            <Button disabled={loading} className="w-[50%] items-center flex justify-center mx-auto px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#869dab] rounded-lg hover:bg-[#3a7a5f] transition-colors" variant="default">
              {loading ? t("signingIn") : t("signInButton")}
            </Button>
          </div>
          {error && <div className="text-center text-destructive">{error}</div>}
          <div className="text-[18px] font-bold text-center ">
            {t("dontHaveAccount")} {" "}
            <Link href="/sign-up" target="_self" className="link font-bold">
              {t("signUp")}
            </Link>
          </div>
        </div>
      </form>
    </>
  );
}