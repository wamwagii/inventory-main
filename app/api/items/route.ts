import { NextResponse } from 'next/server';
import { getItems, saveItems } from '@/lib/data-server';
import { InventoryItem } from '@/types';

// Handle GET requests - get all items
export async function GET() {
  try {
    const items = getItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error in items API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// Handle POST requests - create new item
export async function POST(request: Request) {
  try {
    const itemData = await request.json();
    console.log('Received item data:', itemData);

    // Validate required fields
    const requiredFields = ['item_name', 'item_category', 'item_condition', 'purchase_price', 'sale_price', 'quantity_in_stock', 'purchase_date'];
    const missingFields = requiredFields.filter(field => !itemData[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (isNaN(parseFloat(itemData.purchase_price)) || isNaN(parseFloat(itemData.sale_price)) || isNaN(parseInt(itemData.quantity_in_stock))) {
      console.error('Invalid numeric fields:', {
        purchase_price: itemData.purchase_price,
        sale_price: itemData.sale_price,
        quantity_in_stock: itemData.quantity_in_stock
      });
      return NextResponse.json(
        { error: 'Purchase price, sale price, and quantity must be valid numbers' },
        { status: 400 }
      );
    }

    const items = getItems();

    // Generate new ID
    const newId = items.length > 0 ? Math.max(...items.map(item => item.item_id)) + 1 : 1;
    
    const newItem: InventoryItem = {
      item_id: newId,
      item_name: itemData.item_name,
      item_category: itemData.item_category,
      item_subcategory: itemData.item_subcategory || '',
      item_condition: itemData.item_condition,
      purchase_price: parseFloat(itemData.purchase_price),
      sale_price: parseFloat(itemData.sale_price),
      quantity_in_stock: parseInt(itemData.quantity_in_stock),
      purchase_date: itemData.purchase_date,
      sale_date: itemData.sale_date || '',
      description: itemData.description || '',
      profit_margin: parseFloat(itemData.sale_price) - parseFloat(itemData.purchase_price),
    };

    console.log('Creating new item:', newItem);

    items.push(newItem);
    saveItems(items);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error in items POST API:', error);
    return NextResponse.json(
      { error: `Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}