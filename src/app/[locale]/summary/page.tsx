'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CartItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MapPin, CreditCard, Truck, ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useCart } from '@/lib/context/CartContext';
import Image from 'next/image';

interface Cart {
  id: string;
  items: CartItem[];
  itemsPrice: string;
  totalPrice: string;
  shippingPrice: string;
  taxPrice: string;
}

interface DeliveryAddress {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  idNumber: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
  additionalInfo: string;
}

const SummaryPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { cart, loading, updateCart, refreshCart } = useCart();
  const [deliveryOption, setDeliveryOption] = useState('');
  const [address, setAddress] = useState<DeliveryAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);

  // Load address data from sessionStorage
  useEffect(() => {
    const addressData = sessionStorage.getItem('checkoutAddress');
    if (addressData) {
      try {
        const decodedAddress = JSON.parse(addressData);
        setAddress(decodedAddress);
      } catch (error) {
        console.error('Error parsing address data:', error);
        router.push(`/${params.locale}/checkout/personal`);
      }
    } else {
      // No address data found, redirect to personal info page
      router.push(`/${params.locale}/checkout/personal`);
    }
  }, [router, params.locale]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!loading && (!cart || cart.items.length === 0)) {

      router.push(`/${params.locale}/cart`);
    }
  }, [cart, loading, router, params.locale]);

  // Check for pending payment
  useEffect(() => {
    const pendingPaymentData = sessionStorage.getItem('pendingPayment');
    if (pendingPaymentData) {
      try {
        const payment = JSON.parse(pendingPaymentData);
        setPendingPayment(payment);
      } catch (error) {
        console.error('Error parsing pending payment:', error);
      }
    }
  }, []);

  const calculateDeliveryPrice = (location: string) => {
    // All listed locations are always free
    return 0;
  };

  const calculateTotalPrice = () => {
    if (!cart) return 0;
    const itemsPrice = parseFloat(cart.itemsPrice);
    const taxPrice = parseFloat(cart.taxPrice);
    const deliveryPrice = calculateDeliveryPrice(deliveryOption);
    return itemsPrice + taxPrice + deliveryPrice;
  };

  const handlePlaceOrder = async () => {
    if (!address || !deliveryOption || !paymentMethod) {
      toast.error('Please complete all required fields');
      return;
    }

    // If credit card payment is selected, handle BOG payment
    if (paymentMethod === 'card') {
      try {
        const token = await getToken();
        await createPaymentOrder(token);
        return; // Exit early as createPaymentOrder handles the flow
      } catch (error) {
        console.error('BOG payment error:', error);
        toast.error('გადახდის ინიცირება ვერ მოხერხდა');
        return;
      }
    }

    // For cash on delivery, proceed with normal order creation
    setProcessing(true);
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: address,
          paymentMethod,
          deliveryOption,
          cartId: cart?.id,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Order failed');
      }

      // Set order placed flag to prevent empty cart message
      setOrderPlaced(true);
      toast.success(t('checkout.success'));

      // Store order ID in sessionStorage as backup
      sessionStorage.setItem('lastOrderId', data.order.id);

      // Clean up checkout address data from sessionStorage
      sessionStorage.removeItem('checkoutAddress');

      // Use a more reliable redirect approach
      const orderConfirmationUrl = `/${params.locale}/order-confirmation?orderId=${data.order.id}`;

      // Redirect immediately without clearing cart first
      window.location.href = orderConfirmationUrl;

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(t('checkout.errors.orderFailed'));
      setProcessing(false);
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (params.locale === 'ge') {
      return `${numPrice.toFixed(2)} ლარი`;
    } else {
      return `₾${numPrice.toFixed(2)}`;
    }
  };

  const formatSize = (size: string) => {
    return size.replace('SIZE_', '').replace('_', 'x');
  };

  // Get available delivery locations based on cart items
  const availableLocations = useMemo(() => {
    if (!cart?.items) return [];

    const locations = {
      tbilisi: false,
      batumi: false,
      batumi44: false,
      qutaisi: false,
      kobuleti: false,
    };

    cart.items.forEach(item => {
      if (item.tbilisi) locations.tbilisi = true;
      if (item.batumi) locations.batumi = true;
      if (item.batumi44) locations.batumi44 = true;
      if (item.qutaisi) locations.qutaisi = true;
      if (item.kobuleti) locations.kobuleti = true;
    });

    return Object.entries(locations)
      .filter(([_, available]) => available)
      .map(([location, _]) => location);
  }, [cart?.items]);

  // Auto-select delivery option based on user's city
  useEffect(() => {
    if (address && availableLocations.length > 0 && !deliveryOption) {
      const userCity = address.city.toLowerCase();

      // Check if user's city matches any available location
      if (userCity.includes('tbilisi') && availableLocations.includes('tbilisi')) {
        setDeliveryOption('tbilisi');
      } else if (userCity.includes('batumi') && availableLocations.includes('batumi')) {
        setDeliveryOption('batumi');
      }
      else if (userCity.includes('qutaisi') && availableLocations.includes('qutaisi')) {
        setDeliveryOption('qutaisi');
      } else if (userCity.includes('kobuleti') && availableLocations.includes('kobuleti')) {
        setDeliveryOption('kobuleti');
      } else {
        // If no match, select the first available location
        setDeliveryOption(availableLocations[0]);
      }
    }
  }, [address, availableLocations, deliveryOption]);

  // Cleanup effect to remove address data when component unmounts
  useEffect(() => {
    return () => {
      // Only clean up if order was not placed successfully
      if (!orderPlaced) {
        // Keep the address data in sessionStorage for potential back navigation
        // It will be cleaned up when order is placed successfully
      }
    };
  }, [orderPlaced]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8bg-[#e6dfd9]] rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-[#e6dfd9] rounded"></div>
                ))}
              </div>
              <div className="h-64 bg-[#e6dfd9] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0 || !address) {
    return null; // Will redirect
  }
  const getToken = async () => {
    try {
      // Use the token manager endpoint that handles automatic refresh
      const res = await fetch('/api/token')
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to get token')
      }

      return data.access_token
    } catch (error) {
      console.error('Token error:', error)
      throw new Error('Failed to get BOG access token')
    }
  }

  const createPaymentOrder = async (token: string) => {
    try {
      // Calculate delivery price
      const deliveryPrice = calculateDeliveryPrice(deliveryOption)

      // Calculate total amount
      const totalAmount = calculateTotalPrice()

      // Prepare order data
      const orderData = {
        cart,
        address,
        deliveryOption,
        deliveryPrice,
        totalAmount,
        orderId: `order_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      }

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          orderData
        }),
      })

      const data = await res.json()

      if (data.success && data.redirectUrl) {
   
        window.location.href = data.redirectUrl;
        
        // Also store payment info as backup (in case redirect fails)
        sessionStorage.setItem('pendingPayment', JSON.stringify({
          redirectUrl: data.redirectUrl,
          orderId: data.orderId,
          bogOrderId: data.bogOrderId
        }));
      } else {
        console.error('Payment order creation failed:', data)
        toast.error(data.error || 'დაფიქსირდა შეცდომა გადახდის დაწყებისას')
      }
    } catch (error) {
      console.error('Payment order creation error:', error)
      toast.error('გადახდის ინიცირება ვერ მოხერხდა')
    }
  }

  const handlePendingPayment = () => {
    if (pendingPayment?.redirectUrl) {
      window.location.href = pendingPayment.redirectUrl;
    }
  }

  const clearPendingPayment = () => {
    sessionStorage.removeItem('pendingPayment');
    setPendingPayment(null);
    toast.success('Pending payment cleared');
  }

  const handleBOGPayment = async () => {
    if (processing) return; // Prevent multiple clicks
    

    
    setProcessing(true);
    try {
      // Validate required data
      if (!address || !deliveryOption || !cart) {
        toast.error('გთხოვთ შეავსოთ ყველა საჭირო ველი');
        setProcessing(false);
        return;
      }

      // Calculate delivery price
      const deliveryPrice = calculateDeliveryPrice(deliveryOption);

      // Calculate total amount
      const totalAmount = calculateTotalPrice();

      // Prepare order data
      const orderData = {
        cart,
        address,
        deliveryOption,
        deliveryPrice,
        totalAmount,
        orderId: `order_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
      };

  
      const tokenRes = await fetch('/api/token');
      const tokenData = await tokenRes.json();
   
      
      if (!tokenRes.ok) {
        console.error('Token error:', tokenData);
        toast.error('გადახდის სისტემაში შედის ვერ მოხერხდა. გთხოვთ სცადოთ მოგვიანებით.');
        setProcessing(false);
        return;
      }

      const { access_token } = tokenData;
  
      
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: access_token,
          orderData: orderData
        }),
      });
      
      console.log('=== ORDER CREATION RESPONSE ===');
      console.log('Response status:', orderRes.status);
      console.log('Response ok:', orderRes.ok);

      const orderDataResponse = await orderRes.json();

      if (!orderRes.ok) {
        console.error('=== ORDER CREATION ERROR ===');
        console.error('Response status:', orderRes.status);
        console.error('Response data:', orderDataResponse);
        console.error('Error details:', orderDataResponse.details);
        console.error('Timestamp:', orderDataResponse.timestamp);
        console.error('============================');
        
        // Show more detailed error message
        const errorMessage = orderDataResponse.error || 'შეკვეთის შექმნა ვერ მოხერხდა';
        toast.error(errorMessage);
        console.error('Order creation failed:', orderDataResponse);
        setProcessing(false);
        return;
      }

      if (orderDataResponse.success && orderDataResponse.redirectUrl) {
        console.log('Payment order created successfully:', orderDataResponse);
        
        // Cart will be cleared automatically in the backend after order creation
        console.log('BOG order created successfully, cart will be cleared automatically');
        
        // Automatically redirect to BOG payment page without confirmation
        console.log('Redirecting to BOG payment page:', orderDataResponse.redirectUrl);
        window.location.href = orderDataResponse.redirectUrl;
        
        // Also store payment info as backup (in case redirect fails)
        sessionStorage.setItem('pendingPayment', JSON.stringify({
          redirectUrl: orderDataResponse.redirectUrl,
          orderId: orderDataResponse.orderId,
          bogOrderId: orderDataResponse.bogOrderId
        }));
      } else {
        console.error('Payment order creation failed:', orderDataResponse);
        toast.error(orderDataResponse.error || 'დაფიქსირდა შეცდომა გადახდის დაწყებისას');
        setProcessing(false);
        return;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('გადახდის პროცესში შეცდომა მოხდა. გთხოვთ სცადოთ მოგვიანებით.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-[80px]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <div className="flex items-center justify-between mb-4">
            <Link className="mx-auto" href={`/checkout/personal`}>
              <Button variant="ghost" className="flex text-[20px] text-center items-center md:items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t('checkout.backToPersonal')}
              </Button>
            </Link>

          </div>
          <h1 className="text-[20px] md:text-3xl font-bold text-gray-900">
            {t('checkout.orderSummary')}
          </h1>
          <p className="text-gray-600 mt-2">
            {t('checkout.orderSummaryDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex text-[20px] font-bold items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  {t('checkout.deliveryAddress')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-semibold">
                    {address.firstName} {address.lastName}
                  </p>
                  <p className="text-gray-600">{address.phone}</p>
                  <p className="text-gray-600">{address.email}</p>
                  <p className="text-gray-600">
                    {address.streetAddress}, {address.city}, {address.postalCode}
                  </p>
                  {address.additionalInfo && (
                    <p className="text-gray-600">{address.additionalInfo}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex text-[20px] font-bold items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {t('checkout.deliveryOptions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableLocations.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      {t('checkout.deliveryPricingNote')}
                    </p>
                    {availableLocations.includes('tbilisi') && (
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="delivery"
                          value="tbilisi"
                          checked={deliveryOption === 'tbilisi'}
                          onChange={(e) => setDeliveryOption(e.target.value)}
                          className="text-[#438c71]"
                        />
                        <div>
                          <span className="font-medium">{t('productDetail.locations.tbilisi')}</span>
                          <span className="text-gray-600 ml-2">({t('productDetail.locations.tbilisiAddress')})</span>
                          <span className="text-[#438c71] font-semibold ml-2">
                            - {t('checkout.free')}
                          </span>
                        </div>
                      </label>
                    )}
                    {availableLocations.includes('batumi') && (
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="delivery"
                          value="batumi"
                          checked={deliveryOption === 'batumi'}
                          onChange={(e) => setDeliveryOption(e.target.value)}
                          className="text-[#438c71]"
                        />
                        <div>
                          <span className="font-medium">{t('productDetail.locations.batumi')}</span>
                          <span className="text-gray-600 ml-2">({t('productDetail.locations.batumiAddress')})</span>

                          <span className="text-[#438c71] font-semibold ml-2">
                            - {t('checkout.free')}
                          </span>
                        </div>
                      </label>
                    )}

                    {availableLocations.includes('batumi44') && (
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="delivery"
                          value="batumi44"
                          checked={deliveryOption === 'batumi44'}
                          onChange={(e) => setDeliveryOption(e.target.value)}
                          className="text-[#438c71]"
                        />
                        <div>
                          <span className="font-medium">{t('productDetail.locations.batumi')}</span>
                          <span className="text-gray-600 ml-2">({t('productDetail.locations.batumiAddress2')})</span>
                          <span className="text-[#438c71] font-semibold ml-2">
                            - {t('checkout.free')}
                          </span>
                        </div>
                      </label>
                    )}

                    {availableLocations.includes('qutaisi') && (
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="delivery"
                          value="qutaisi"
                          checked={deliveryOption === 'qutaisi'}
                          onChange={(e) => setDeliveryOption(e.target.value)}
                          className="text-[#438c71]"
                        />
                        <div>
                          <span className="font-medium">{t('productDetail.locations.qutaisi')}</span>
                          <span className="text-gray-600 ml-2">({t('productDetail.locations.qutaisiAddress')})</span>
                          <span className="text-[#438c71] font-semibold ml-2">
                            - {t('checkout.free')}
                          </span>
                        </div>
                      </label>
                    )}
                    {availableLocations.includes('kobuleti') && (
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="delivery"
                          value="kobuleti"
                          checked={deliveryOption === 'kobuleti'}
                          onChange={(e) => setDeliveryOption(e.target.value)}
                          className="text-[#438c71]"
                        />
                        <div>
                          <span className="font-medium">{t('productDetail.locations.kobuleti')}</span>
                          <span className="text-gray-600 ml-2">({t('productDetail.locations.kobuletiAddress')})</span>
                          <span className="text-[#438c71] font-semibold ml-2">
                            - {t('checkout.free')}
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                ) : (
                  <p className="text-red-500">{t('checkout.noDeliveryLocations')}</p>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex text-[20px] font-bold items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t('checkout.paymentMethod')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-[#438c71] transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                      }}
                      className="text-[#438c71]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-[#438c71]" />
                        <span className="font-semibold text-lg">
                          {t('checkout.creditCard')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        ბარათით გადახდა
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:border-[#438c71] transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-[#438c71]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-[#438c71]" />
                        <span className="font-semibold text-lg">{t('checkout.cashOnDelivery')}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        ნაღდი ფულით გადახდა მიტანისას
                      </p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[20px] font-bold">{t('checkout.orderItems')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={`${item.productId}-${item.size}`} className="flex items-center space-x-4">
                      <Image
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md"
                        width={64}
                        height={64}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-600">
                          {t('checkout.size')}: {formatSize(item.size)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t('checkout.quantity')}: {item.qty}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#438c71]">
                          {formatPrice((parseFloat(item.price) * item.qty).toString())}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className=" top-8">
              <CardHeader>
                <CardTitle className="flex text-[20px] font-bold items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  {t('checkout.orderSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-bold text-[18px]">{t('checkout.subtotal')}</span>
                    <span className="font-semibold">{formatPrice(cart.itemsPrice)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-bold text-[18px]">{t('checkout.delivery')}</span>
                    <span className="font-semibold">
                      {deliveryOption ? formatPrice(calculateDeliveryPrice(deliveryOption).toString()) : '-'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-bold text-[18px]">{t('checkout.total')}</span>
                    <span className="text-[#438c71]">
                      {deliveryOption ? formatPrice(calculateTotalPrice().toString()) : formatPrice(cart.totalPrice)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={paymentMethod === 'card' ? handleBOGPayment : handlePlaceOrder}
                  disabled={!deliveryOption || !paymentMethod || processing}
                  className="w-full flex text-[20px] font-bold items-center justify-center gap-2 px-6 py-3 text-lg  text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin text-[20px] font-bold rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {t('checkout.processing')}
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      <span className="text-[20px] font-bold">
                        {paymentMethod === 'card' ? 'გადახდა ბარათით' : t('checkout.placeOrder')}
                      </span>
                    </>
                  )}
                </Button>

                {/* Pending Payment Section */}
                {pendingPayment && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">
                      გადახდის მონაცემების გასუფთავება
                    </h3>
                    <p className="text-sm text-yellow-700 mb-3">
                      გადახდის მონაცემების გასუფთავება
                    </p>
                    <div className="space-y-2">
                      <Button
                        onClick={handlePendingPayment}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                      გააგრძელეთ გადახდა ბარათით
                      </Button>
                      <Button
                        onClick={clearPendingPayment}
                        variant="outline"
                        className="w-full"
                      >
                          გადახდის მონაცემების გასუფთავება
                      </Button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 text-center">
                  {t('checkout.securePayment')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage; 