import React, { useState } from 'react';
import { Search, Building, Plus } from 'lucide-react';
import { Department } from '../types/Department';
import DepartmentCard from './DepartmentCard';

interface DepartmentListProps {
  departments: Department[];
  onAddDepartment: () => void;
  onEditDepartment: (department: Department) => void;
  onDeleteDepartment: (departmentId: string) => void;
}

const DepartmentList: React.FC<DepartmentListProps> = ({ 
  departments, 
  onAddDepartment, 
  onEditDepartment, 
  onDeleteDepartment 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDepartments = departments.filter(department => 
    department.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">部署マスタ管理</h2>
          <p className="text-gray-600 mt-1">
            職員登録で使用する部署の管理（全{departments.length}部署）
          </p>
        </div>
        <button
          onClick={onAddDepartment}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>新規部署追加</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="部署名で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Department Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          {filteredDepartments.length === 0 ? (
            <div className="text-center py-12">
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
                  : '「新規部署追加」ボタンから部署を追加してください'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDepartments.map((department) => (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  onEdit={onEditDepartment}
                  onDelete={onDeleteDepartment}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Usage Info */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Building className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">部署マスタについて</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• ここで登録した部署は、職員登録時の「部署」プルダウンに表示されます</p>
              <p>• 部署を削除する前に、その部署に所属する職員がいないか確認してください</p>
              <p>• 部署名を変更すると、既存職員の部署表示も自動的に更新されます</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentList;