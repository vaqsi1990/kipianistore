'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function VerifyEmailForm() {
  const t = useTranslations('auth.verifyEmail');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
 
      
      if (!token) {
   
        setStatus('error');
        setMessage(t('noToken'));
        return;
      }

      try {
      
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

  
        
        const data = await response.json();
   

        if (response.ok) {
    
          setStatus('success');
          setMessage(data.message);
        } else {
          
          setStatus('error');
          setMessage(data.error || t('verificationFailed'));
        }
      } catch (error) {
 
        setStatus('error');
        setMessage(t('errorOccurred'));
      }
    };

    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(verifyEmail, 100);
    return () => clearTimeout(timer);
  }, [token, t]);

  const handleResendVerification = async () => {
    try {
      const email = searchParams.get('email');

      
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(t('resendSuccess'));
      } else {
        alert(data.error || t('resendError'));
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      alert(t('resendError'));
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <CardTitle>{t('verifying')}</CardTitle>
            <CardDescription>
              {t('verifyingDescription')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'success' ? (
              <CheckCircle className="h-12 w-12 text-[#438c71]" />
            ) : (
              <XCircle className="h-12 w-12 text-[#438c71]" />
            )}
          </div>
          <CardTitle>
            {status === 'success' ? t('success') : t('error')}
          </CardTitle>
          <CardDescription className='text-[18px] font-bold'>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' ? (
            <div className="space-y-2">
              <Button asChild className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors">
                <Link href="/sign-in">
                  {t('continueToSignIn')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button 
                onClick={handleResendVerification}
                variant="outline"
                className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors"
              >
                {t('resendVerification')}
              </Button>
              <button
             className="w-full mb-14 px-4 py-2 text-[20px] font-bold text-[#438c71] bg-white border-2 border-[#438c71] rounded-lg hover:bg-[#438c71] hover:text-white transition-colors flex items-center justify-center gap-2">
                <Link href="/sign-in">
                  {t('backToSignIn')}
                </Link>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 