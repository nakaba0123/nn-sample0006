import React from 'react';
import { User, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { User as UserType } from '../types/User';

interface UserSelectorProps {
  users: UserType[];
}

const UserSelector: React.FC<UserSelectorProps> = ({ users }) => {
  const { currentUser, login, logout, getUserRole } = useAuth();

  const activeUsers = users.filter(user => {
    const autoStatus = user.retirementDate 
      ? new Date(user.retirementDate) <= new Date() ? 'inactive' : 'active'
      : 'active';
    return autoStatus === 'active';
  });

  const currentRole = getUserRole();

  return (
    <div className="flex items-center space-x-4">
      {currentUser ? (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentRole?.displayName}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="ログアウト"
          >
            <LogOut className="w-4 h-4" />
            <span>ログアウト</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">ユーザーを選択</span>
          </div>
          <select
            onChange={(e) => {
              const selectedUser = activeUsers.find(u => u.id === e.target.value);
              if (selectedUser) login(selectedUser);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">ログインユーザーを選択</option>
            {activeUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role === 'admin' ? '管理者' : user.role === 'staff' ? '一般職員' : user.role === 'payroll' ? '給与担当者' : user.role})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default UserSelector;