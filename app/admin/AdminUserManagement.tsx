'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface UserStats {
  id: number;
  email: string | null;
  username: string | null;
  isAdmin: boolean | null;
  isContentCreator: boolean | null;
  cityCount: number;
  totalPopulation: number;
  totalMoney: number;
  totalXP: number;
  lastUpload: Date | null;
}

interface AdminUserManagementProps {
  users: UserStats[];
}

type SortField = 'username' | 'email' | 'isAdmin' | 'isContentCreator' | 'cityCount' | 'totalPopulation' | 'totalMoney' | 'totalXP' | 'lastUpload';
type SortDirection = 'asc' | 'desc';

export function AdminUserManagement({ users }: AdminUserManagementProps) {
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);
  const [updatingContentCreator, setUpdatingContentCreator] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [adminFilter, setAdminFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [creatorFilter, setCreatorFilter] = useState<'all' | 'creator' | 'regular'>('all');
  const [cityCountFilter, setCityCountFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const ITEMS_PER_PAGE = 15;

  const formatNumber = (num: number) => {
    // For very large numbers, use abbreviations
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2).replace(/\.?0+$/, '') + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M';
    }
    
    return num.toLocaleString();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    // Use consistent date formatting to avoid hydration errors
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      // Search filter
      const username = user.username || '';
      const email = user.email || '';
      const searchMatch = username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Admin filter
      const adminMatch = adminFilter === 'all' || 
                        (adminFilter === 'admin' && user.isAdmin) ||
                        (adminFilter === 'user' && !user.isAdmin);
      
      // Creator filter
      const creatorMatch = creatorFilter === 'all' ||
                          (creatorFilter === 'creator' && user.isContentCreator) ||
                          (creatorFilter === 'regular' && !user.isContentCreator);
      
      // City count filter
      const cityCountMatch = cityCountFilter === 'all' ||
                            (cityCountFilter === 'active' && user.cityCount > 0) ||
                            (cityCountFilter === 'inactive' && user.cityCount === 0);
      
      return searchMatch && adminMatch && creatorMatch && cityCountMatch;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'username':
          aValue = (a.username || a.email || '').toLowerCase();
          bValue = (b.username || b.email || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'isAdmin':
          aValue = a.isAdmin ? 1 : 0;
          bValue = b.isAdmin ? 1 : 0;
          break;
        case 'isContentCreator':
          aValue = a.isContentCreator ? 1 : 0;
          bValue = b.isContentCreator ? 1 : 0;
          break;
        case 'cityCount':
          aValue = a.cityCount;
          bValue = b.cityCount;
          break;
        case 'totalPopulation':
          aValue = a.totalPopulation;
          bValue = b.totalPopulation;
          break;
        case 'totalMoney':
          aValue = a.totalMoney;
          bValue = b.totalMoney;
          break;
        case 'totalXP':
          aValue = a.totalXP;
          bValue = b.totalXP;
          break;
        case 'lastUpload':
          aValue = a.lastUpload ? new Date(a.lastUpload).getTime() : 0;
          bValue = b.lastUpload ? new Date(b.lastUpload).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchQuery, sortField, sortDirection, adminFilter, creatorFilter, cityCountFilter]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredAndSortedUsers.slice(startIndex, endIndex);

  const toggleAdminStatus = async (userId: number, currentStatus: boolean) => {
    setUpdatingUser(userId);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin: !currentStatus }),
      });

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to update admin status: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to update admin status. Please try again.');
    } finally {
      setUpdatingUser(null);
    }
  };

  const toggleContentCreatorStatus = async (userId: number, currentStatus: boolean) => {
    setUpdatingContentCreator(userId);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-content-creator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isContentCreator: !currentStatus }),
      });

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to update content creator status: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to update content creator status. Please try again.');
    } finally {
      setUpdatingContentCreator(null);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setAdminFilter('all');
    setCreatorFilter('all');
    setCityCountFilter('all');
    setSortField('username');
    setSortDirection('asc');
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} users
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-4">
          <select
            value={adminFilter}
            onChange={(e) => {
              setAdminFilter(e.target.value as 'all' | 'admin' | 'user');
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Admin Status</option>
            <option value="admin">Admin Only</option>
            <option value="user">Users Only</option>
          </select>

          <select
            value={creatorFilter}
            onChange={(e) => {
              setCreatorFilter(e.target.value as 'all' | 'creator' | 'regular');
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Creator Status</option>
            <option value="creator">Creators Only</option>
            <option value="regular">Regular Only</option>
          </select>

          <select
            value={cityCountFilter}
            onChange={(e) => {
              setCityCountFilter(e.target.value as 'all' | 'active' | 'inactive');
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Activity</option>
            <option value="active">Active (Has Cities)</option>
            <option value="inactive">Inactive (No Cities)</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('username')}
              >
                <div className="flex items-center space-x-1">
                  <span>User</span>
                  <SortIcon field="username" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('isAdmin')}
              >
                <div className="flex items-center space-x-1">
                  <span>Admin Status</span>
                  <SortIcon field="isAdmin" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('isContentCreator')}
              >
                <div className="flex items-center space-x-1">
                  <span>Creator Status</span>
                  <SortIcon field="isContentCreator" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('cityCount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Cities</span>
                  <SortIcon field="cityCount" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('totalPopulation')}
              >
                <div className="flex items-center space-x-1">
                  <span>Total Population</span>
                  <SortIcon field="totalPopulation" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('totalMoney')}
              >
                <div className="flex items-center space-x-1">
                  <span>Total Money</span>
                  <SortIcon field="totalMoney" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('totalXP')}
              >
                <div className="flex items-center space-x-1">
                  <span>Total XP</span>
                  <SortIcon field="totalXP" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('lastUpload')}
              >
                <div className="flex items-center space-x-1">
                  <span>Last Upload</span>
                  <SortIcon field="lastUpload" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {currentUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {(user.username || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.username || 'No username'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isAdmin 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}>
                    {user.isAdmin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isContentCreator 
                      ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}>
                    {user.isContentCreator ? 'Creator' : 'Regular'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {user.cityCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatNumber(user.totalPopulation)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  ${formatNumber(user.totalMoney)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatNumber(user.totalXP)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(user.lastUpload)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col space-y-2">
                    <Link
                      href={`/user/${user.id}`}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Profile
                    </Link>
                    <div className="flex flex-wrap gap-2">
                      {user.email !== 'danielveerkamp@live.com' && (
                        <button
                          onClick={() => toggleAdminStatus(user.id, user.isAdmin || false)}
                          disabled={updatingUser === user.id}
                          className={`text-xs px-2 py-1 rounded-md transition-colors ${
                            user.isAdmin
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                              : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                          } ${updatingUser === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {updatingUser === user.id 
                            ? 'Updating...' 
                            : user.isAdmin 
                              ? 'Remove Admin' 
                              : 'Make Admin'
                          }
                        </button>
                      )}
                      <button
                        onClick={() => toggleContentCreatorStatus(user.id, user.isContentCreator || false)}
                        disabled={updatingContentCreator === user.id}
                        className={`text-xs px-2 py-1 rounded-md transition-colors ${
                          user.isContentCreator
                            ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30'
                            : 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30'
                        } ${updatingContentCreator === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {updatingContentCreator === user.id 
                          ? 'Updating...' 
                          : user.isContentCreator 
                            ? 'Remove Creator' 
                            : 'Make Creator'
                        }
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {/* Page number buttons */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 