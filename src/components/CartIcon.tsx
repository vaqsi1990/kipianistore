'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingCart } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/lib/context/CartContext';

const CartIcon = () => {
  const t = useTranslations();
  const { cartItemCount, loading } = useCart();

  return (
    <Link href="/cart" className="relative inline-flex items-center p-2 text-white  transition-colors">
      <ShoppingCart className="h-6 w-6" />
      {!loading && cartItemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {cartItemCount > 99 ? '99+' : cartItemCount}
        </span>
      )}
    </Link>
  );
};

export default CartIcon; 