import { NextRequest, NextResponse } from 'next/server';
import { refreshAllBOGOrderStatuses } from '@/lib/actions/admin.actions';

export async function POST(request: NextRequest) {
  try {
    const result = await refreshAllBOGOrderStatuses();
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('Error in refresh BOG orders endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to refresh BOG orders' }, 
      { status: 500 }
    );
  }
}
