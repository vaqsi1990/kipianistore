import { NextRequest, NextResponse } from 'next/server';
import { getMyCart } from '@/lib/actions/cart.actions';

export async function GET(request: NextRequest) {
  try {
  
    const cart = await getMyCart();
  
    
    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Error getting cart:', error);
    // Return empty cart instead of error for better UX
    return NextResponse.json({ cart: null });
  }
} 