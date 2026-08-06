'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Link } from "@/i18n/navigation";
import { useFormState, useFormStatus } from 'react-dom';
import { signUpUser } from '@/lib/actions/user.actions';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

const signUpDefaultValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const initialState = {
  success: false,
  message: '',
  email: '',
};

function SignupForm({ callbackUrl }: { callbackUrl: string }) {
  const [data, action] = useFormState(signUpUser, initialState);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);
  const { pending } = useFormStatus();
  const router = useRouter();
  const t = useTranslations("auth.signUp");

  useEffect(() => {
    if (data.success && data.email) {
      setShowVerificationMessage(true);
      setVerificationData(data);
    }
  }, [data.success, data.email]);

  const SignUpButton = () => (
    <Button disabled={pending} className="w-[50%] items-center flex justify-center mx-auto px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#869dab] rounded-lg hover:bg-[#3a7a5f] transition-colors" variant="default">
      {pending ? t("creatingAccount") : t("signUpButton")}
    </Button>
  );

  const handleResendVerification = async () => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: verificationData.email }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Show success message
        alert(t("verificationSent"));
      } else {
        alert(result.error || t("verificationError"));
      }
    } catch (error) {
      alert(t("verificationError"));
    }
  };

  const clearVerificationState = () => {
    setShowVerificationMessage(false);
    setVerificationData(null);
  };

  if (showVerificationMessage) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-4 font-bold text-center">
          <div className="flex justify-center">
            <Mail className="h-12 w-12 text-[#869dab]" />
          </div>
          <CardTitle className="text-[18px]  font-bold">{t("checkEmail")}</CardTitle>
          <CardDescription className='text-[18px] text-black font-bold'>
            {t("checkEmailDescription")} <strong>{verificationData?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center font-bold space-y-4">
            <p className="text-sm  font-bold">
              {t("checkEmailInstructions")}
            </p>
            <div className="space-y-2">
              <Button 
                onClick={handleResendVerification}
                variant="outline"
                className="w-full px-4 mb-5 py-2 text-[20px] font-bold text-white bg-[#869dab] rounded-lg hover:bg-[#3a7a5f] transition-colors"
              >
                {t("resendVerification")}
              </Button>
              <Button  variant="outline"
                 className="w-full mb-5 px-4 py-2 text-[20px] font-bold text-[#869dab] bg-white border-2 border-[#869dab] rounded-lg hover:bg-[#869dab] hover:text-white transition-colors flex items-center justify-center ">
                <Link href="/sign-in" onClick={clearVerificationState}>
                  {t("backToSignIn")}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="space-y-6">
        <div>
          <Label className='text-[18px] font-bold' htmlFor="name">{t("name")}</Label>
          <Input 
            id="name" 
            name="name" 
            type="text" 
            autoComplete="name" 
            defaultValue={signUpDefaultValues.name} 
            placeholder={t("namePlaceholder")}
          />
        </div>
        <div>
          <Label className='text-[18px] font-bold' htmlFor="email">{t("email")}</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            autoComplete="email" 
            defaultValue={signUpDefaultValues.email} 
            placeholder={t("emailPlaceholder")}
          />
        </div>
        <div>
          <Label className='text-[18px] font-bold' htmlFor="password">{t("password")}</Label>
          <PasswordInput 
            id="password" 
            name="password" 
            autoComplete="new-password" 
            defaultValue={signUpDefaultValues.password} 
            placeholder={t("passwordPlaceholder")}
          />
        </div>
        <div>
          <Label className='text-[18px] font-bold' htmlFor="confirmPassword">{t("confirmPassword")}</Label>
          <PasswordInput 
            id="confirmPassword" 
            name="confirmPassword" 
            autoComplete="new-password" 
            defaultValue={signUpDefaultValues.confirmPassword} 
            placeholder={t("confirmPasswordPlaceholder")}
          />
        </div>
        <div>
          <SignUpButton />
        </div>

        {data && !data.success && (
          <div className="text-center text-destructive">{data.message}</div>
        )}

        <div className="text-[18px] text-center font-bold">
          {t("alreadyHaveAccount")}{' '}
          <Link href="/sign-in" className="link">
            {t("signIn")}
          </Link>
        </div>
      </div>
    </form>
  );
}

export default SignupForm;
