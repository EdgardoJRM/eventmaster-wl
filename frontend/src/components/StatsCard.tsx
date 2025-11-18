'use client';

import { useTheme } from '@/contexts/ThemeContext';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'primary' | 'accent' | 'success' | 'warning';
}

export function StatsCard({ title, value, icon, trend, color = 'primary' }: StatsCardProps) {
  const { branding } = useTheme();

  const getColorClass = () => {
    switch (color) {
      case 'primary':
        return branding?.primary_color || '#9333ea';
      case 'accent':
        return branding?.accent_color || '#3b82f6';
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      default:
        return branding?.primary_color || '#9333ea';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-sm text-gray-500 ml-2">vs mes anterior</span>
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-center w-14 h-14 rounded-full text-white"
          style={{ backgroundColor: getColorClass(), opacity: 0.9 }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

