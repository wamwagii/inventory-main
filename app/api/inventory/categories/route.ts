import { NextResponse } from 'next/server';
import { getCategories, saveCategories } from '@/lib/data-server';
import { Category } from '@/types';

export async function GET() {
  try {
    const categories = getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, subcategories }: { name: string; subcategories: string[] } = await request.json();
    const categories = getCategories();

    const newId = categories.length > 0 ? Math.max(...categories.map(cat => cat.id)) + 1 : 1;
    
    const newCategory: Category = {
      id: newId,
      name,
      subcategories: subcategories || []
    };

    categories.push(newCategory);
    saveCategories(categories);

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}