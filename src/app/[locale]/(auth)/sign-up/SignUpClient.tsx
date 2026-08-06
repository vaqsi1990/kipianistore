"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import SignupForm from "./signupForm";

interface SignUpClientProps {
  callbackUrl: string;
}

export default function SignUpClient({ callbackUrl }: SignUpClientProps) {
  const t = useTranslations("auth.signUp");

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="mt-[100px]">
        <CardHeader className="space-y-4">
          <CardTitle className="text-center text-xl"> {t("description")}</CardTitle>
      
        </CardHeader>
        <CardContent className="space-y-4">
          <SignupForm callbackUrl={callbackUrl} />
        </CardContent>
      </Card>
    </div>
  );
} 