import React from 'react';
import { User, Mail, Building, Briefcase, Calendar, Hash, Edit, Trash2, History, LogOut, Shield } from 'lucide-react';
import { User as UserType } from '../types/User';
import { useAuth } from '../hooks/useAuth';

interface UserCardProps {
  user: UserType;
  onEdit: (user: UserType) => void;
  onDelete: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  const { roles } = useAuth();

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-red-100 text-red-700 border-red-200';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? '在職中' : '退職済み';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // 現在の部署を取得
  const getCurrentDepartment = () => {
    const currentHistory = user.departmentHistory?.find(h => !h.endDate);
    return currentHistory?.departmentName || user.department || '未設定';
  };

  // 部署履歴の数を取得
  const getDepartmentHistoryCount = () => {
    return user.departmentHistory?.length || 0;
  };

  // 退職日に基づく自動ステータス判定
  const getAutoStatus = () => {
    if (!user.retirementDate) return 'active';
    const today = new Date();
    const retirement = new Date(user.retirementDate);
    return retirement <= today ? 'inactive' : 'active';
  };

  // ロール表示用の情報を取得
  const getRoleDisplay = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    return role ? role.displayName : roleName;
  };

  const getRoleColor = (roleName: string) => {
    const colorMap: { [key: string]: string } = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      staff: 'bg-blue-100 text-blue-700 border-blue-200',
      payroll: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colorMap[roleName] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const autoStatus = getAutoStatus();
  const isStatusMismatch = user.status !== autoStatus;

  console.log("user::", user);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {getInitials(user.name)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.position || '役職未設定'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(user.status)}`}>
            {getStatusText(user.status)}
          </span>
          {isStatusMismatch && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              要確認
            </span>
          )}
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(user)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
              title="編集"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(user.id)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-colors"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ロール表示 */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${getRoleColor(user.role)}`}>
          <Shield className="w-3 h-3 mr-1" />
          {getRoleDisplay(user.role)}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{user.email}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Building className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{getCurrentDepartment()}</span>
        </div>
        {user.employeeId && (
          <div className="flex items-center space-x-2 text-sm">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{user.employeeId}</span>
          </div>
        )}
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">入社: {formatDate(user.joinDate)}</span>
        </div>
      </div>

      {/* 退職日表示 */}
      {user.retirementDate && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2 text-sm">
            <LogOut className="w-4 h-4 text-red-600" />
            <span className="text-red-800 font-medium">
              退職日: {formatDate(user.retirementDate)}
            </span>
          </div>
          {isStatusMismatch && (
            <p className="text-xs text-amber-700 mt-1">
              ⚠️ ステータスと退職日が一致していません
            </p>
          )}
        </div>
      )}

      {/* 部署履歴情報 */}
      {getDepartmentHistoryCount() > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 text-sm">
            <History className="w-4 h-4 text-blue-600" />
            <span className="text-blue-800 font-medium">
              部署履歴: {getDepartmentHistoryCount()}件
            </span>
          </div>
          <div className="mt-2 text-xs text-blue-700">
            {user.departmentHistory
              ?.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
              .slice(0, 2)
              .map((history, index) => (
                <div key={history.id} className="flex justify-between">
                  <span>{history.departmentName}</span>
                  <span>
                    {formatDate(history.startDate)} - {history.endDate ? formatDate(history.endDate) : '現在'}
                  </span>
                </div>
              ))}
            {getDepartmentHistoryCount() > 2 && (
              <div className="text-blue-600 mt-1">他 {getDepartmentHistoryCount() - 2}件...</div>
            )}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>登録日: {formatDate(user.createdAt)}</span>
          <span>ID: {String(user.id).slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
