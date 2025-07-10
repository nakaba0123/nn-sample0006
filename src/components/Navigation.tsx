import React from 'react';
import { MessageSquare, Users, Clock, Home, Building, Calendar, Settings, UserCheck, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import PermissionGuard from './PermissionGuard';

interface NavigationProps {
  activeTab: 'attendance' | 'users' | 'grouphomes' | 'departments' | 'shifts' | 'masters' | 'residents' | 'usage';
  onTabChange: (tab: 'attendance' | 'users' | 'grouphomes' | 'departments' | 'shifts' | 'masters' | 'residents' | 'usage') => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { currentUser } = useAuth();

  const tabs = [
    {
      id: 'attendance' as const,
      name: '出勤管理',
      icon: <Clock className="w-5 h-5" />,
      description: 'Slack連携対応',
      permissions: ['attendance.report.own', 'attendance.view.all', 'attendance.manage']
    },
    {
      id: 'users' as const,
      name: '職員管理',
      icon: <Users className="w-5 h-5" />,
      description: 'ユーザー登録・編集',
      permissions: ['user.view.all', 'user.create', 'user.edit']
    },
    {
      id: 'residents' as const,
      name: '利用者管理',
      icon: <UserCheck className="w-5 h-5" />,
      description: '利用者登録・管理',
      permissions: ['user.view.all', 'user.create', 'user.edit']
    },
    {
      id: 'usage' as const,
      name: '利用実績',
      icon: <FileText className="w-5 h-5" />,
      description: '月次利用記録',
      permissions: ['user.view.all', 'user.create', 'user.edit']
    },
    {
      id: 'grouphomes' as const,
      name: 'グループホーム',
      icon: <Home className="w-5 h-5" />,
      description: '施設管理・登録',
      permissions: ['grouphome.create', 'grouphome.edit', 'grouphome.delete']
    },
    {
      id: 'shifts' as const,
      name: 'シフト希望',
      icon: <Calendar className="w-5 h-5" />,
      description: '勤務希望管理',
      permissions: ['shift.preference.own', 'shift.preference.view.all', 'shift.create', 'shift.edit']
    },
    {
      id: 'masters' as const,
      name: 'マスタ管理',
      icon: <Settings className="w-5 h-5" />,
      description: '各種マスタ設定',
      permissions: ['system.settings', 'department.manage']
    }
  ];

  if (!currentUser) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">出勤管理システム</h1>
              <p className="text-sm text-gray-500">ログインしてください</p>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">出勤管理システム</h1>
            </div>
          </div>
          
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <PermissionGuard key={tab.id} permissions={tab.permissions}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  <div className="text-left">
                    <div className="text-sm font-medium">{tab.name}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              </PermissionGuard>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;