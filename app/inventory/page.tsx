'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryItem } from '@/types';
import { formatKES } from '@/lib/utils';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem('authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadItems();
  }, [router]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    setDeletingId(itemId);
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the item from local state
        setItems(prev => prev.filter(item => item.item_id !== itemId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('An error occurred while deleting the item');
    } finally {
      setDeletingId(null);
    }
  };

  // Get unique categories and conditions for filters
  const categories = [...new Set(items.map(item => item.item_category))];
  const conditions = [...new Set(items.map(item => item.item_condition))];

  // Filter items based on selected filters
  const filteredItems = items.filter(item => {
    const categoryMatch = !filterCategory || item.item_category === filterCategory;
    const conditionMatch = !filterCondition || item.item_condition === filterCondition;
    return categoryMatch && conditionMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <button
              onClick={loadItems}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold">All Inventory Items</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span>Total Items: {items.length}</span>
              <button
                onClick={() => router.push('/inventory/add')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
              >
                Add New Item
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                  Condition
                </label>
                <select
                  id="condition"
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Conditions</option>
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilterCategory('');
                    setFilterCondition('');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Inventory Items
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {filteredItems.length} of {items.length} items
                </p>
              </div>
              <button
                onClick={loadItems}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="border-t border-gray-200">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="mt-2">No items found.</p>
                  {items.length === 0 ? (
                    <button 
                      onClick={() => router.push('/inventory/add')}
                      className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Add your first item
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setFilterCategory('');
                        setFilterCondition('');
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear filters to see all items
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Condition
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purchase Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sale Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Profit
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr key={item.item_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                              <div className="text-sm text-gray-500">
                                {item.item_subcategory && (
                                  <span>{item.item_subcategory} • </span>
                                )}
                                {item.description && (
                                  <span className="truncate max-w-xs">{item.description}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {item.item_category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              item.item_condition === 'new' ? 'bg-green-100 text-green-800' :
                              item.item_condition === 'like new' ? 'bg-blue-100 text-blue-800' :
                              item.item_condition === 'gently used' ? 'bg-yellow-100 text-yellow-800' :
                              item.item_condition === 'refurbished' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.item_condition.charAt(0).toUpperCase() + item.item_condition.slice(1).replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatKES(item.purchase_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatKES(item.sale_price)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            item.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatKES(item.profit_margin)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.quantity_in_stock > 10 ? 'bg-green-100 text-green-800' : 
                              item.quantity_in_stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.quantity_in_stock} in stock
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleDeleteItem(item.item_id)}
                              disabled={deletingId === item.item_id}
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete item"
                            >
                              {deletingId === item.item_id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}