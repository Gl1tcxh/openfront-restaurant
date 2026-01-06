import { NextResponse } from 'next/server';
import { getFeaturedMenuItems } from '@/features/storefront/lib/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get('take') || '8');

    const items = await getFeaturedMenuItems({ take });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching featured items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured items' },
      { status: 500 }
    );
  }
}
