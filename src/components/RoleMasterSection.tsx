import React from 'react';
import { Shield, Plus, Edit, Trash2, Users, Lock, Key } from 'lucide-react';
import { Role } from '../types/Role';

interface RoleMasterSectionProps {
  roles: Role[];
  searchTerm: string;
  onAdd: () => void;
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
}

const RoleMasterSection: React.FC<RoleMasterSectionProps> = ({
  roles,
  searchTerm,
  onAdd,
  onEdit,
  onDelete
}) => {
  const filteredRoles = roles.filter(role =>
    role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getRoleColor = (roleName: string) => {
    const colorMap: { [key: string]: string } = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      staff: 'bg-blue-100 text-blue-700 border-blue-200',
      payroll: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colorMap[roleName] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const isSystemRole = (roleName: string) => {
    return ['admin', 'staff', 'payroll'].includes(roleName);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">ロールマスタ</h3>
            <p className="text-sm text-gray-600">職員のアクセス権限を制御するロールの管理</p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>ロール追加</span>
        </button>
      </div>

      {/* Role List */}
      {filteredRoles.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {searchTerm 
              ? '検索条件に一致するロールが見つかりません' 
              : 'まだロールが登録されていません'
            }
          </p>
          <p className="text-sm text-gray-400">
            {searchTerm 
              ? '検索条件を変更してください' 
              : '「ロール追加」ボタンからロールを追加してください'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRoles.map((role) => (
            <div
              key={role.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-800">{role.displayName}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getRoleColor(role.name)}`}>
                        {role.name}
                      </span>
                      {isSystemRole(role.name) && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200">
                          <Lock className="w-3 h-3 inline mr-1" />
                          システム
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{role.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>登録日: {formatDate(role.createdAt)}</span>
                      <span className="flex items-center space-x-1">
                        <Key className="w-3 h-3" />
                        <span>{role.permissions.length}個の権限</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    ID: {role.id.slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => onEdit(role)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-50 text-purple-600 transition-colors"
                    title="編集"
                    disabled={isSystemRole(role.name)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(role.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-colors"
                    title="削除"
                    disabled={isSystemRole(role.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Permissions Preview */}
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs font-medium text-gray-700 mb-2">主な権限:</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 5).map((permission) => (
                    <span
                      key={permission.id}
                      className="px-2 py-1 bg-white text-gray-600 text-xs rounded border"
                    >
                      {permission.displayName}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                      +{role.permissions.length - 5}個
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center space-x-2 text-sm text-purple-700">
          <Users className="w-4 h-4" />
          <span>
            現在 <strong>{filteredRoles.length}</strong> 件のロールが登録されています
            {searchTerm && ` (「${searchTerm}」で検索中)`}
          </span>
        </div>
        <p className="text-xs text-purple-600 mt-1">
          💡 システムロール（admin, staff, payroll）は編集・削除できません
        </p>
      </div>
    </div>
  );
};

export default RoleMasterSection;