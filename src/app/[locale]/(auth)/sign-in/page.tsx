import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";
import React from "react";
import CredentialsForm from "./credentialsForm";
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import SignInClient from "./SignInClient";

export const metadata: Metadata = {
  title: "Sign In",
};

async function page(props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) {
  const { callbackUrl } = await props.searchParams;

  const session = await auth();

  if (session) {
    return redirect(callbackUrl || "/");
  }

  return <SignInClient callbackUrl={callbackUrl} />;
}

export default page;
