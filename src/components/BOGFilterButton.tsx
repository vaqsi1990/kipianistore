'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

const BOGFilterButton: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bogOnly = searchParams.get('bog') === 'true';

  const toggleBOGFilter = () => {
    if (bogOnly) {
      // Remove BOG filter
      router.push('/adminall/orders');
    } else {
      // Add BOG filter
      router.push('/adminall/orders?bog=true');
    }
  };

  return (
    <Button 
      className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors" 
      variant="outline" 
      size="sm"
      onClick={toggleBOGFilter}
      title="Toggle BOG Orders Only"
    >
      {bogOnly ? 'ყველა შეკვეთა' : 'მხოლოდ BOG'}
    </Button>
  );
};

export default BOGFilterButton;
