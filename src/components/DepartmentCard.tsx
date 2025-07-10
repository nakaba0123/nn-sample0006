import React from 'react';
import { Building, Calendar, Edit, Trash2 } from 'lucide-react';
import { Department } from '../types/Department';

interface DepartmentCardProps {
  department: Department;
  onEdit: (department: Department) => void;
  onDelete: (departmentId: string) => void;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, onEdit, onDelete }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{department.name}</h3>
            <p className="text-sm text-gray-500">部署ID: {department.id.slice(0, 8)}...</p>
          </div>
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(department)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-indigo-50 text-indigo-600 transition-colors"
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

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>作成日: {formatDate(department.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentCard;