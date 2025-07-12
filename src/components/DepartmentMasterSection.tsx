import React from 'react';
import { Building, Plus, Edit, Trash2, Users } from 'lucide-react';
import { Department } from '../types/Department';

interface DepartmentMasterSectionProps {
  departments: Department[];
  searchTerm: string;
  onAdd: () => void;
  onEdit: (department: Department) => void;
  onDelete: (departmentId: string) => void;
}

const DepartmentMasterSection: React.FC<DepartmentMasterSectionProps> = ({
  departments,
  searchTerm,
  onAdd,
  onEdit,
  onDelete
}) => {
  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">部署マスタ</h3>
            <p className="text-sm text-gray-600">職員登録で使用する部署の管理</p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>部署追加</span>
        </button>
      </div>

      {/* Department List */}
      {filteredDepartments.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">
            {searchTerm 
              ? '検索条件に一致する部署が見つかりません' 
              : 'まだ部署が登録されていません'
            }
          </p>
          <p className="text-sm text-gray-400">
            {searchTerm 
              ? '検索条件を変更してください' 
              : '「部署追加」ボタンから部署を追加してください'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDepartments.map((department) => (
            <div
              key={department.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{department.name}</h4>
                    <p className="text-sm text-gray-500">
                      登録日: {formatDate(department.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    ID: {String(department.id).slice(0, 8)}...
                  </span>
                  <button
                    onClick={() => onEdit(department)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                    title="編集"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(department.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center space-x-2 text-sm text-blue-700">
          <Users className="w-4 h-4" />
          <span>
            現在 <strong>{filteredDepartments.length}</strong> 件の部署が登録されています
            {searchTerm && ` (「${searchTerm}」で検索中)`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DepartmentMasterSection;
