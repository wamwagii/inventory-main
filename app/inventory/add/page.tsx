'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types';
import { formatKES } from '@/lib/utils';

export default function AddItem() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    item_name: '',
    item_category: '',
    item_subcategory: '',
    item_condition: 'new' as 'new' | 'like new' | 'gently used' | 'refurbished' | 'used',
    purchase_price: '',
    sale_price: '',
    quantity_in_stock: '',
    purchase_date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchCategories();
  }, [router]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    const category = categories.find(cat => cat.name === categoryName);
    setAvailableSubcategories(category?.subcategories || []);
    setFormData(prev => ({
      ...prev,
      item_category: categoryName,
      item_subcategory: ''
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const itemData = {
        ...formData,
        purchase_price: parseFloat(formData.purchase_price),
        sale_price: parseFloat(formData.sale_price),
        quantity_in_stock: parseInt(formData.quantity_in_stock),
        item_subcategory: formData.item_subcategory || undefined
      };

      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create item');
      }
    } catch (err) {
      setError('An error occurred while creating the item');
      console.error('Error creating item:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = () => {
    const purchase = parseFloat(formData.purchase_price) || 0;
    const sale = parseFloat(formData.sale_price) || 0;
    return sale - purchase;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Add New Inventory Item</h1>
            <p className="mt-1 text-sm text-gray-600">
              Add a new product to your inventory. All prices are in Kenyan Shillings (KES).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                
                <div>
                  <label htmlFor="item_name" className="block text-sm font-medium text-gray-700">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    id="item_name"
                    name="item_name"
                    required
                    value={formData.item_name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., Samsung 4K Smart TV 55-inch"
                  />
                </div>

                <div>
                  <label htmlFor="item_category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    id="item_category"
                    name="item_category"
                    required
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="item_subcategory" className="block text-sm font-medium text-gray-700">
                    Subcategory
                  </label>
                  <select
                    id="item_subcategory"
                    name="item_subcategory"
                    value={formData.item_subcategory}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select a subcategory</option>
                    {availableSubcategories.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="item_condition" className="block text-sm font-medium text-gray-700">
                    Condition *
                  </label>
                  <select
                    id="item_condition"
                    name="item_condition"
                    required
                    value={formData.item_condition}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="new">New</option>
                    <option value="like new">Like New</option>
                    <option value="gently used">Gently Used</option>
                    <option value="refurbished">Refurbished</option>
                    <option value="used">Used</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Product description, features, specifications..."
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Pricing & Stock</h3>
                
                <div>
                  <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700">
                    Purchase Price (KES) *
                  </label>
                  <input
                    type="number"
                    id="purchase_price"
                    name="purchase_price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700">
                    Sale Price (KES) *
                  </label>
                  <input
                    type="number"
                    id="sale_price"
                    name="sale_price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>

                {/* Profit Display */}
                {formData.purchase_price && formData.sale_price && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-sm text-gray-600">
                      Profit Margin: <span className={`font-medium ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatKES(calculateProfit())}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="quantity_in_stock" className="block text-sm font-medium text-gray-700">
                    Quantity in Stock *
                  </label>
                  <input
                    type="number"
                    id="quantity_in_stock"
                    name="quantity_in_stock"
                    required
                    min="0"
                    value={formData.quantity_in_stock}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    id="purchase_date"
                    name="purchase_date"
                    required
                    value={formData.purchase_date}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding Item...' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}