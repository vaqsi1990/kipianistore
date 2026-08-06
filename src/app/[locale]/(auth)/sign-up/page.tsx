import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metadata } from "next";

import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import SignUpClient from "./SignUpClient";

export const metadata: Metadata = {
  title: "Sign Up",
};

const SignUpPage = async (props: {
  searchParams: Promise<{
    callbackUrl: string;
  }>;
}) => {
  const { callbackUrl } = await props.searchParams;
  const session = await auth();

  // If user is already authenticated, redirect to home
  if (session) {
    return redirect("/");
  }

  return <SignUpClient callbackUrl={callbackUrl} />;
};

export default SignUpPage;
