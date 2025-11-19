import { NextResponse } from 'next/server';
import { getCategories, saveCategories } from '@/lib/data-server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id);
    let categories = getCategories();
    
    categories = categories.filter(cat => cat.id !== categoryId);
    saveCategories(categories);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}