'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useCart } from '@/lib/context/CartContext';

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

const PersonalInfoPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const { cart, loading } = useCart();
  const [address, setAddress] = useState<DeliveryAddress>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    idNumber: '',
    streetAddress: '',
    city: '',
    postalCode: '',
    country: 'Georgia',
    additionalInfo: '',
  });
  const [errors, setErrors] = useState<Partial<DeliveryAddress>>({});

  // Redirect if cart is empty or no address data
  useEffect(() => {
    if (!loading && (!cart || cart.items.length === 0)) {
      router.push(`/${params.locale}/cart`);
    }
    if (!loading && !address) {
      router.push(`/${params.locale}/checkout/personal`);
    }
  }, [cart, loading, address, router, params.locale]);

  const handleAddressChange = (field: keyof DeliveryAddress, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<DeliveryAddress> = {};

    if (!address.firstName.trim()) {
      newErrors.firstName = t('checkout.validation.firstNameRequired');
    }
    if (!address.lastName.trim()) {
      newErrors.lastName = t('checkout.validation.lastNameRequired');
    }
    if (!address.phone.trim()) {
      newErrors.phone = t('checkout.validation.phoneRequired');
    } else if (!/^(\+995|995)?[0-9]{9}$/.test(address.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('checkout.validation.phoneInvalid');
    }
    if (!address.email.trim()) {
      newErrors.email = t('checkout.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      newErrors.email = t('checkout.validation.emailInvalid');
    }
    if (!address.idNumber.trim()) {
      newErrors.idNumber = t('checkout.validation.idNumberRequired');
    } else if (!/^[0-9]{11}$/.test(address.idNumber.replace(/\s/g, ''))) {
      newErrors.idNumber = t('checkout.validation.idNumberInvalid');
    }
    if (!address.streetAddress.trim()) {
      newErrors.streetAddress = t('checkout.validation.streetAddressRequired');
    }
    if (!address.city.trim()) {
      newErrors.city = t('checkout.validation.cityRequired');
    }
    if (!address.postalCode.trim()) {
      newErrors.postalCode = t('checkout.validation.postalCodeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    const isValid = validateForm();
    
    if (!isValid) {
      toast.error(t('checkout.errors.tryAgain'));
      return;
    }

    try {
      // Send address data via POST to the API
      const response = await fetch('/api/checkout/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process address');
      }

      // Store address data in sessionStorage as backup
      sessionStorage.setItem('checkoutAddress', JSON.stringify(address));
      
      // Navigate to summary page without address in URL
      router.push(`/${params.locale}/summary`);
    } catch (error) {
      console.error('Error processing address:', error);
      toast.error(t('checkout.errors.tryAgain'));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white rounded"></div>
              ))}   
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return null; // Will redirect to cart
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 mt-14">
          <div className="flex text-center md:text-left mx-auto items-center justify-between mb-4">
            <Link className="mx-auto" href={`/${params.locale}/cart`}>
              <Button variant="ghost" className="flex text-[20px] text-center items-center md:items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t('checkout.backToCart')}
              </Button>
            </Link>
           
          </div>
          <h1 className="  md:text-3xl text-[20px] text-center font-bold text-gray-900">
            {t('checkout.personalInfo')}
          </h1>
          <p className="text-gray-600 mt-2 text-center ">
            {t('checkout.personalInfoDescription')}
          </p>
        </div>

        {/* Personal Information Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center font-bold gap-2">
              <User className="h-6 w-6" />
              <p className="text-[20px]">

              {t('checkout.personalDetails')}
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[18px] font-bold" htmlFor="firstName">{t('checkout.firstName')} *</Label>
                <Input
                  id="firstName"
                  value={address.firstName}
                  onChange={(e) => handleAddressChange('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <Label className="text-[18px] font-bold" htmlFor="lastName">{t('checkout.lastName')} *</Label>
                <Input
                  id="lastName"
                  value={address.lastName}
                  onChange={(e) => handleAddressChange('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[18px] font-bold" htmlFor="phone">{t('checkout.phone')} *</Label>
                <Input
                  id="phone"
                  value={address.phone}
                  onChange={(e) => handleAddressChange('phone', e.target.value)}
                  placeholder="+995 5XX XXX XXX"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
              <div>
                <Label className="text-[18px] font-bold" htmlFor="email">{t('checkout.email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={address.email}
                  onChange={(e) => handleAddressChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            {/* ID Number */}
            <div>
              <Label className="text-[18px] font-bold" htmlFor="idNumber">{t('checkout.idNumber')} *</Label>
              <Input
                id="idNumber"
                value={address.idNumber}
                onChange={(e) => handleAddressChange('idNumber', e.target.value)}
                placeholder="12345678901"
                className={errors.idNumber ? 'border-red-500' : ''}
              />
              {errors.idNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.idNumber}</p>
              )}
            </div>

            {/* Address Fields */}
            <div>
              <Label className="text-[18px] font-bold" htmlFor="streetAddress">{t('checkout.streetAddress')} *</Label>
              <Input
                id="streetAddress"
                value={address.streetAddress}
                onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                className={errors.streetAddress ? 'border-red-500' : ''}
              />
              {errors.streetAddress && (
                <p className="text-red-500 text-sm mt-1">{errors.streetAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-[18px] font-bold" htmlFor="city">{t('checkout.city')} *</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>
              <div>
                <Label className="text-[18px] font-bold" htmlFor="postalCode">{t('checkout.postalCode')} *</Label>
                <Input
                  id="postalCode"
                  value={address.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  className={errors.postalCode ? 'border-red-500' : ''}
                />
                {errors.postalCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                )}
              </div>
              <div>
                <Label className="text-[18px] font-bold" htmlFor="country">{t('checkout.country')}</Label>
                <Input
                  id="country"
                  value={address.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  disabled
                />
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <Label className="text-[18px] font-bold" htmlFor="additionalInfo">{t('checkout.additionalInfo')}</Label>
              <Input
                id="additionalInfo"
                value={address.additionalInfo}
                onChange={(e) => handleAddressChange('additionalInfo', e.target.value)}
                placeholder={t('checkout.additionalInfoPlaceholder')}
              />
            </div>
          </CardContent>
        </Card>

                  {/* Continue Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleContinue}
              className="inline-flex text-[20px] font-bold items-center gap-2 px-8 py-3  text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors"
            >
              {t('checkout.continueToSummary')}
            </button>
          </div>
      </div>
    </div>
  );
};

export default PersonalInfoPage; 