import { NextResponse } from 'next/server';
import { getCategories, saveCategories } from '@/lib/data-server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Change: params is now a Promise
) {
  try {
    const { id } = await params; // Change: await the params
    const categoryId = parseInt(id);
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
