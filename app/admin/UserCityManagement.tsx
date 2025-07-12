'use client';

import { useState } from 'react';
import Link from 'next/link';

interface User {
  id: number;
  email: string | null;
  username: string | null;
}

interface City {
  id: number;
  userId: number;
  cityName: string | null;
  mapName: string | null;
  population: number | null;
  money: number | null;
  xp: number | null;
  theme: string | null;
  gameMode: string | null;
  fileName: string | null;
  uploadedAt: Date | null;
  primaryImageThumbnail: string | null;
  unlimitedMoney?: boolean;
}

export function UserCityManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userCities, setUserCities] = useState<City[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [deletingCityId, setDeletingCityId] = useState<number | null>(null);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/search-users?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectUser = async (user: User) => {
    setSelectedUser(user);
    setUserCities([]);
    setIsLoadingCities(true);
    
    try {
      const response = await fetch(`/api/admin/user-cities/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserCities(data.cities);
      }
    } catch (error) {
      console.error('Error loading user cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const deleteCity = async (cityId: number) => {
    if (!confirm('Are you sure you want to delete this city? This action cannot be undone.')) {
      return;
    }

    setDeletingCityId(cityId);
    try {
      const response = await fetch(`/api/admin/delete-city/${cityId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove the city from the local state
        setUserCities(prev => prev.filter(city => city.id !== cityId));
        alert('City deleted successfully');
      } else {
        const error = await response.json();
        alert(`Error deleting city: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting city:', error);
      alert('Error deleting city');
    } finally {
      setDeletingCityId(null);
    }
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return 'N/A';
    return num.toLocaleString();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div>
      
      {/* User Search */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Search Users</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={searchUsers}
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Search Results</h3>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => selectUser(user)}
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.username || 'No username'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  Select →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected User Cities */}
      {selectedUser && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Cities by {selectedUser.username || selectedUser.email}
            </h3>
            <button
              onClick={() => {
                setSelectedUser(null);
                setUserCities([]);
                setSearchResults([]);
                setSearchQuery('');
              }}
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear Selection
            </button>
          </div>

          {isLoadingCities ? (
            <div className="text-center py-8">
              <div className="text-gray-600 dark:text-gray-400">Loading cities...</div>
            </div>
          ) : userCities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600 dark:text-gray-400">This user has no cities uploaded.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {userCities.map((city) => (
                <div key={city.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        {city.primaryImageThumbnail && (
                          <img
                            src={city.primaryImageThumbnail}
                            alt={city.cityName || 'City'}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            <Link 
                              href={`/city/${city.id}`}
                              className="hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {city.cityName || 'Unnamed City'}
                            </Link>
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {city.mapName} • {city.theme} • {city.gameMode}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Pop: {formatNumber(city.population)} | 
                            Money: {city.unlimitedMoney ? '∞' : `$${formatNumber(city.money)}`} | 
                            XP: {formatNumber(city.xp)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Uploaded: {formatDate(city.uploadedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/city/${city.id}`}
                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => deleteCity(city.id)}
                        disabled={deletingCityId === city.id}
                        className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingCityId === city.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 