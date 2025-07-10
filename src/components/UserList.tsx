import React, { useState } from 'react';
import { Search, Filter, Users, Plus, LogOut } from 'lucide-react';
import { User } from '../types/User';
import { useAuth } from '../hooks/useAuth';
import UserCard from './UserCard';
import PermissionGuard from './PermissionGuard';

interface UserListProps {
  users: User[];
  onAddUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onAddUser, onEditUser, onDeleteUser }) => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // 退職日に基づく自動ステータス判定
  const getAutoStatus = (user: User) => {
    if (!user.retirementDate) return 'active';
    const today = new Date();
    const retirement = new Date(user.retirementDate);
    return retirement <= today ? 'inactive' : 'active';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = !departmentFilter || user.department === departmentFilter;
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = getAutoStatus(user) === 'active';
    } else if (statusFilter === 'inactive') {
      matchesStatus = getAutoStatus(user) === 'inactive';
    } else if (statusFilter === 'mismatch') {
      // ステータス不一致のユーザーのみ表示
      matchesStatus = user.status !== getAutoStatus(user);
    }
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesRole;
  });

  const departments = [...new Set(users.map(user => {
    const currentHistory = user.departmentHistory?.find(h => !h.endDate);
    return currentHistory?.departmentName || user.department;
  }).filter(dept => dept))];

  const roles = [...new Set(users.map(user => user.role).filter(role => role))];

  const activeUsers = users.filter(user => getAutoStatus(user) === 'active').length;
  const retiredUsers = users.filter(user => getAutoStatus(user) === 'inactive').length;
  const mismatchUsers = users.filter(user => user.status !== getAutoStatus(user)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">職員管理</h2>
          <div className="flex items-center space-x-4 mt-1 text-sm">
            <span className="text-gray-600">全{users.length}名</span>
            <span className="text-green-600">在職中: {activeUsers}名</span>
            <span className="text-red-600">退職済み: {retiredUsers}名</span>
            {mismatchUsers > 0 && (
              <span className="text-amber-600">ステータス要確認: {mismatchUsers}名</span>
            )}
          </div>
        </div>
        <PermissionGuard permission="user.create">
          <button
            onClick={onAddUser}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>新規登録</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="名前、メール、社員IDで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="">全部署</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <Users className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="">全ステータス</option>
              <option value="active">在職中のみ</option>
              <option value="inactive">退職済みのみ</option>
              <option value="mismatch">ステータス要確認</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="">全ロール</option>
              <option value="admin">管理者</option>
              <option value="staff">一般職員</option>
              <option value="payroll">給与担当者</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Mismatch Alert */}
      {mismatchUsers > 0 && statusFilter !== 'mismatch' && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-start space-x-3">
            <LogOut className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">ステータス確認が必要な職員があります</h3>
              <p className="text-sm text-amber-700 mt-1">
                {mismatchUsers}名の職員で、退職日とステータスが一致していません。
                <button
                  onClick={() => setStatusFilter('mismatch')}
                  className="ml-2 text-amber-800 underline hover:text-amber-900"
                >
                  該当職員を表示
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* User Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchTerm || departmentFilter || statusFilter || roleFilter
                  ? '検索条件に一致する職員が見つかりません' 
                  : 'まだ職員が登録されていません'
                }
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm || departmentFilter || statusFilter || roleFilter
                  ? '検索条件を変更してください' 
                  : '「新規登録」ボタンから職員を追加してください'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={onEditUser}
                  onDelete={onDeleteUser}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <LogOut className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">アクセス権限について</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>管理者</strong>: システム全体の管理権限（職員登録・編集、シフト作成・編集、全データ閲覧）</p>
              <p>• <strong>一般職員</strong>: 自分の出勤報告、シフト予定閲覧、自分のシフト希望登録</p>
              <p>• <strong>給与担当者</strong>: 全職員の出勤記録閲覧、勤怠管理、給与計算関連</p>
              <p>• 退職日が設定されている場合、その日付に基づいて自動的にステータスが判定されます</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;