import { NextRequest, NextResponse } from 'next/server';
import { getMenuItemsWithFilters } from '@/features/storefront/lib/queries';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const categoryId = searchParams.get('category') || undefined;
  const dietaryFlags = searchParams.getAll('dietary');
  const mealPeriods = searchParams.getAll('meal');
  const sortBy = (searchParams.get('sortBy') || 'name') as 'name' | 'price_asc' | 'price_desc';
  const page = parseInt(searchParams.get('page') || '1');

  const result = await getMenuItemsWithFilters({
    categoryId,
    dietaryFlags: dietaryFlags.length > 0 ? dietaryFlags : undefined,
    mealPeriods: mealPeriods.length > 0 ? mealPeriods : undefined,
    sortBy,
    page,
  });

  return NextResponse.json(result);
}
