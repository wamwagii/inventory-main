'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InventoryItem, InventoryStats } from '@/types';
import { formatKES } from '@/lib/utils';

// Define the API response type
interface ApiResponse {
  stats: InventoryStats;
  recentItems: InventoryItem[];
}

export default function Dashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem('authenticated');
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory data');
      }
      
      const data: ApiResponse = await response.json();
      setStats(data.stats);
      setItems(data.recentItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading data:', err);
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
        // Remove the item from local state for immediate UI update
        setItems(prev => prev.filter(item => item.item_id !== itemId));
        // Reload stats to update the dashboard numbers
        await loadData();
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

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    localStorage.removeItem('username');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              onClick={loadData}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
          <button
            onClick={loadData}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            Load Data
          </button>
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
              <h1 className="text-xl font-semibold">StarWave</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span>Welcome, Admin</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Items in Stock</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">{stats.totalItems}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Inventory Value</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">{formatKES(stats.totalValue)}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Profit Potential</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">{formatKES(stats.totalProfit)}</dd>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Categories</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">{Object.keys(stats.categoryStats).length}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Category Breakdown</h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                {Object.entries(stats.categoryStats).map(([category, categoryStats]) => (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{category}</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div>Items: {categoryStats.count}</div>
                      <div>Value: {formatKES(categoryStats.value)}</div>
                      <div>Profit: {formatKES(categoryStats.profit)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => router.push('/inventory/add')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Add New Item
            </button>
            <button
              onClick={() => router.push('/inventory/categories')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Manage Categories
            </button>
            <button
              onClick={() => router.push('/inventory')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              View All Items
            </button>
            <button
              onClick={loadData}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Recent Items */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Items</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{items.length} items</span>
                {items.length > 0 && (
                  <button
                    onClick={() => router.push('/inventory')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All →
                  </button>
                )}
              </div>
            </div>
            <div className="border-t border-gray-200">
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="mt-2">No items found in your inventory.</p>
                  <button 
                    onClick={() => router.push('/inventory/add')}
                    className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Add your first item
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.item_id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className={`w-3 h-3 rounded-full ${
                              item.quantity_in_stock > 10 ? 'bg-green-400' : 
                              item.quantity_in_stock > 0 ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-900 truncate">{item.item_name}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                    {item.item_category}
                                  </span>
                                  {item.item_subcategory && (
                                    <span className="text-gray-600">{item.item_subcategory}</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Condition: <span className="capitalize">{item.item_condition}</span>
                                  {item.description && (
                                    <span className="ml-2">• {item.description}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 ml-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">{formatKES(item.sale_price)}</div>
                            <div className="text-xs text-gray-500">Cost: {formatKES(item.purchase_price)}</div>
                            <div className={`text-xs ${item.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Profit: {formatKES(item.profit_margin)}
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.quantity_in_stock > 10 ? 'bg-green-100 text-green-800' : 
                            item.quantity_in_stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.quantity_in_stock} in stock
                          </span>
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
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}