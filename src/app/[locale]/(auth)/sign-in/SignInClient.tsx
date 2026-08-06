"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import CredentialsForm from "./credentialsForm";

interface SignInClientProps {
  callbackUrl: string;
}

export default function SignInClient({ callbackUrl }: SignInClientProps) {
  const t = useTranslations("auth.signIn");

  return (
    <div className="w-full max-w-md mt-40 mx-auto">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-center text-xl"> {t("description")}</CardTitle>
   
          <CardContent className="space-y-4">
            <CredentialsForm callbackUrl={callbackUrl} />
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
} 