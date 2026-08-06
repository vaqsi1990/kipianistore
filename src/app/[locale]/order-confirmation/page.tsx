'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface OrderConfirmationProps {
  params: {
    locale: string;
  };
}

const OrderConfirmationPage = ({ params }: OrderConfirmationProps) => {
  const searchParams = useSearchParams();
  const t = useTranslations('common');
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const status = searchParams.get('status');
    const orderIdParam = searchParams.get('orderId');
    
    setOrderStatus(status || 'unknown');
    setOrderId(orderIdParam || '');
    setLoading(false);
  }, [searchParams]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          title: 'Payment Successful',
          description: 'Your payment has been processed successfully. Your order will be processed soon.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-500',
        };
      case 'failed':
        return {
          icon: XCircle,
          title: 'Payment Failed',
          description: 'There was an issue processing your payment. Please try again or contact support.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-500',
        };
      case 'cancelled':
        return {
          icon: AlertCircle,
          title: 'Payment Cancelled',
          description: 'The payment was cancelled. You can try again or choose a different payment method.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-500',
        };
      default:
        return {
          icon: Clock,
          title: 'Payment Status Unknown',
          description: 'We could not determine the payment status. Please check your order or contact support.',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-500',
        };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-[80px]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#438c71] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment status...</p>
        </div>
      </div>
    );
  }

  const config = getStatusConfig(orderStatus);
  const StatusIcon = config.icon;

  return (
    <div className="container mx-auto px-4 py-8 mt-[80px]">
      <div className="max-w-2xl mx-auto">
        <Card className={`border-l-4 ${config.borderColor} ${config.bgColor}`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <StatusIcon className={`h-16 w-16 ${config.color}`} />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {config.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600 text-lg">
              {config.description}
            </p>
            
            {orderId && (
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-mono text-lg font-semibold text-gray-900">{orderId}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${params.locale}`}>
                <Button className="w-full sm:w-auto">
                  Continue Shopping
                </Button>
              </Link>
              
              {orderStatus === 'failed' || orderStatus === 'cancelled' ? (
                <Link href={`/${params.locale}/summary`}>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Try Again
                  </Button>
                </Link>
              ) : (
                <Link href={`/${params.locale}/profile`}>
                  <Button variant="outline" className="w-full sm:w-auto">
                    View Orders
                  </Button>
                </Link>
              )}
            </div>

            {orderStatus === 'success' && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>What happens next?</strong>
                </p>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• You will receive an order confirmation email</li>
                  <li>• We will process your order within 24 hours</li>
                  <li>• You will be notified when your order ships</li>
                  <li>• Delivery will be made to your specified address</li>
                </ul>
              </div>
            )}

            {orderStatus === 'failed' && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Need help?</strong>
                </p>
                <p className="text-sm text-red-700 mt-2">
                  If you continue to experience issues, please contact our support team 
                  or try using a different payment method.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
