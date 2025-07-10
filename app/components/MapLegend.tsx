'use client';

import { useState } from 'react';

export function MapLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <span className="font-medium text-gray-900 dark:text-gray-100">Map Legend</span>
        <svg
          className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Legend Content */}
      {isOpen && (
        <div className="p-3 pt-0 max-h-96 overflow-y-auto">
          {/* Transport Icons */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Transport</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">B</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Bus Stop</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Taxi Stand</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Train Station</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Tram Stop</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Subway Station</span>
              </div>
            </div>
          </div>

          {/* Roads */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Roads</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-2 rounded" style={{ backgroundColor: '#849BBD' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Motorway</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-2 rounded" style={{ backgroundColor: '#96D296' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Trunk Road</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-2 rounded" style={{ backgroundColor: '#ECA2A3' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Primary Road</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-2 rounded" style={{ backgroundColor: '#FDD6A4' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Secondary Road</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-2 rounded" style={{ backgroundColor: '#FEFEB2' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Tertiary Road</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-2 rounded" style={{ backgroundColor: '#CCCCCC' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Residential/Service</span>
              </div>
            </div>
          </div>

          {/* Railways */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Railways</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-2 rounded" style={{ backgroundColor: '#666666' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Railway</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-2 rounded" style={{ backgroundColor: '#10B981' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Tram Line</span>
              </div>
            </div>
          </div>

          {/* Buildings */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Buildings</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4CAF50' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Residential</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#DBEAFE' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Commercial/Shops</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FEF3C7' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Industrial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF0000' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Hospital</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#000080' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Police Station</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF6666' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Fire Station</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8B5CF6' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Transport Station</span>
              </div>
            </div>
          </div>

          {/* Land Use */}
          <div className="mb-4">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Land Use</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#66BB6A' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Residential Area</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EFC8C8' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Commercial Area</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#DFD1D6' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Industrial Area</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8DC56C' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Forest/Woods</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#C0F6B0' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Park</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#2E86AB' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Water</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E9D8BD' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Farmland</span>
              </div>
            </div>
          </div>

          {/* Other Features */}
          <div className="mb-2">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">Other</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#5c5c5c' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Power Lines</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#D08F55' }}></div>
                <span className="text-sm text-gray-700 dark:text-gray-300">Mountain Peak</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 