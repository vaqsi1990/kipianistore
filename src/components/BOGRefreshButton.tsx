'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { FaSyncAlt } from 'react-icons/fa';

const BOGRefreshButton: React.FC = () => {
  const handleRefresh = async () => {
    try {
      const response = await fetch('/api/admin/refresh-bog-orders', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert(`BOG orders refreshed: ${result.message}`);
        window.location.reload();
      } else {
        alert('Failed to refresh BOG orders');
      }
    } catch (error) {
      alert('Error refreshing BOG orders');
    }
  };

  return (
    <Button 
      className="w-full px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#438c71] rounded-lg hover:bg-[#3a7a5f] transition-colors" 
      variant="outline" 
      size="sm"
      onClick={handleRefresh}
      title="Refresh BOG Order Statuses"
    >
      <FaSyncAlt className="mr-2" />
      BOG Status-ის განახლება
    </Button>
  );
};

export default BOGRefreshButton;
