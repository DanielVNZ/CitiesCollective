'use client';

interface StatsSectionProps {
  stats: {
    totalUsers: number;
    totalCities: number;
    totalLikes: number;
    totalComments: number;
    totalViews: number;
  };
}

export function StatsSection({ stats }: StatsSectionProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">Join our growing community of city builders</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300 mb-1">
            {formatNumber(stats.totalUsers)}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">Total Users</div>
        </div>
        
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
            {formatNumber(stats.totalCities)}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Total Cities</div>
        </div>
        
        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 mb-1">
            {formatNumber(stats.totalLikes)}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">Total Likes</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-1">
            {formatNumber(stats.totalComments)}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">Total Comments</div>
        </div>
        
        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-2xl font-bold text-red-700 dark:text-red-300 mb-1">
            {formatNumber(stats.totalViews)}
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">Total Home Page Views</div>
          <div className="text-[10px] text-red-600 dark:text-red-400 mt-1">from 20/07/2025</div>
        </div>
      </div>
    </div>
  );
} 