'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle, RefreshCw, Home, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface PaymentFailPageProps {
  params: {
    locale: string;
  };
}

const PaymentFailPage = ({ params }: PaymentFailPageProps) => {
  const searchParams = useSearchParams();
  const t = useTranslations('common');
  const [orderId, setOrderId] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    const errorCodeParam = searchParams.get('error_code');
    const errorMsgParam = searchParams.get('error_message');
    
    setOrderId(orderIdParam || '');
    setErrorCode(errorCodeParam || '');
    setErrorMessage(errorMsgParam || '');
  }, [searchParams]);

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'INSUFFICIENT_FUNDS':
        return 'Insufficient funds in your account. Please try with a different payment method.';
      case 'CARD_DECLINED':
        return 'Your card was declined. Please check your card details or try a different card.';
      case 'EXPIRED_CARD':
        return 'Your card has expired. Please use a different payment method.';
      case 'INVALID_CARD':
        return 'Invalid card information. Please check and try again.';
      case 'TRANSACTION_TIMEOUT':
        return 'The transaction timed out. Please try again.';
      case 'BANK_ERROR':
        return 'A bank error occurred. Please try again later.';
      default:
        return errorMessage || 'Payment processing failed. Please try again or contact support.';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-[80px]">
      <div className="max-w-2xl mx-auto">
        <Card className="border-l-4 border-red-500 bg-red-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Payment Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <p className="text-gray-600 text-lg">
                We&apos;re sorry, but your payment could not be processed.
              </p>
              
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="text-sm text-gray-500 mb-2">Error Details</p>
                <p className="text-red-700 font-medium">
                  {getErrorMessage(errorCode)}
                </p>
                {errorCode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Error Code: {errorCode}
                  </p>
                )}
              </div>

              {orderId && (
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono text-lg font-semibold text-gray-900">{orderId}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">What you can do:</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <RefreshCw className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Try Again</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Attempt the payment again with the same or different payment method.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <CreditCard className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Different Method</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Use a different payment method or card.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${params.locale}/summary`}>
                <Button className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </Link>
              
              <Link href={`/${params.locale}`}>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Home className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Need help?
                  </p>
                  <p className="text-sm text-blue-700">
                    If you continue to experience issues, please contact our support team. 
                    We&apos;re here to help you complete your purchase.
                  </p>
                  <div className="mt-2">
                    <Link href={`/${params.locale}/contact`}>
                      <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800">
                        Contact Support
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Your order has not been charged</p>
              <p>• Your cart items are still saved</p>
              <p>• You can retry the payment at any time</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentFailPage; 