import { Metadata } from "next";
import VerifyEmailForm from "@/components/verify-email-form"; 

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address to complete your account setup",
};

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
} 