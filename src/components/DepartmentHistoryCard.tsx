import React from 'react';
import { Building, Calendar, Edit, Trash2, Clock } from 'lucide-react';
import { DepartmentHistory } from '../types/User';

interface DepartmentHistoryCardProps {
  history: DepartmentHistory;
  onEdit: (history: DepartmentHistory) => void;
  onDelete: (historyId: string) => void;
}

const DepartmentHistoryCard: React.FC<DepartmentHistoryCardProps> = ({ 
  history, 
  onEdit, 
  onDelete 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const isCurrentDepartment = !history.endDate;

  // イベントハンドラーでイベント伝播を防ぐ
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(history);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(history.id);
  };

  return (
    <div className={`bg-white rounded-lg border p-4 hover:shadow-sm transition-all duration-200 ${
      isCurrentDepartment ? 'border-green-200 bg-green-50' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isCurrentDepartment 
              ? 'bg-green-100 text-green-600' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800">{history.departmentName}</h4>
            {isCurrentDepartment && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 mt-1">
                <Clock className="w-3 h-3 mr-1" />
                現在所属中
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={handleEditClick}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
            title="編集"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-colors"
            title="削除"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <Calendar className="w-3 h-3 text-gray-400" />
          <div>
            <p className="text-gray-500">開始日</p>
            <p className="font-medium text-gray-800">{formatDate(history.startDate)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-3 h-3 text-gray-400" />
          <div>
            <p className="text-gray-500">終了日</p>
            <p className="font-medium text-gray-800">
              {history.endDate ? formatDate(history.endDate) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentHistoryCard;