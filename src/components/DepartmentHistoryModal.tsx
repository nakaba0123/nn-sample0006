import React, { useState, useEffect } from 'react';
import { X, Building, Calendar } from 'lucide-react';
import { DepartmentHistory, DepartmentHistoryFormData } from '../types/User';
import { Department } from '../types/Department';

interface DepartmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentHistoryFormData) => void;
  editHistory?: DepartmentHistory | null;
  departments: Department[];
  existingHistory: DepartmentHistory[];
}

const DepartmentHistoryModal: React.FC<DepartmentHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editHistory,
  departments,
  existingHistory
}) => {
  const [formData, setFormData] = useState<DepartmentHistoryFormData>({
    departmentName: '',
    startDate: '',
    endDate: ''
  });

  const [errors, setErrors] = useState<Partial<DepartmentHistoryFormData>>({});

  useEffect(() => {
    if (editHistory) {
      setFormData({
        departmentName: editHistory.departmentName,
        startDate: editHistory.startDate,
        endDate: editHistory.endDate || ''
      });
    } else {
      setFormData({
        departmentName: '',
        startDate: '',
        endDate: ''
      });
    }
  }, [editHistory, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<DepartmentHistoryFormData> = {};
    
    if (!formData.departmentName.trim()) {
      newErrors.departmentName = '部署を選択してください';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = '開始日を入力してください';
    }
    
    if (formData.endDate && formData.startDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = '終了日は開始日より後にしてください';
    }

    // 期間の重複チェック
    if (formData.startDate) {
      const conflictingHistory = existingHistory.find(history => {
        if (editHistory && history.id === editHistory.id) return false;
        
        const newStart = new Date(formData.startDate);
        const newEnd = formData.endDate ? new Date(formData.endDate) : null;
        const existingStart = new Date(history.startDate);
        const existingEnd = history.endDate ? new Date(history.endDate) : null;
        
        // 期間の重複判定
        if (newEnd && existingEnd) {
          // 両方に終了日がある場合
          return (newStart <= existingEnd && newEnd >= existingStart);
        } else if (!newEnd && !existingEnd) {
          // 両方とも現在進行中（終了日なし）
          return true;
        } else if (!newEnd) {
          // 新しい履歴が現在進行中
          return newStart <= (existingEnd || new Date());
        } else if (!existingEnd) {
          // 既存の履歴が現在進行中
          return (newEnd >= existingStart);
        }
        
        return false;
      });

      if (conflictingHistory) {
        newErrors.startDate = '他の部署履歴と期間が重複しています';
      }
    }

    // 現在所属中の部署が複数ないかチェック
    if (!formData.endDate) {
      const currentDepartments = existingHistory.filter(history => 
        !history.endDate && (!editHistory || history.id !== editHistory.id)
      );
      
      if (currentDepartments.length > 0) {
        newErrors.endDate = '現在所属中の部署は1つまでです。他の履歴に終了日を設定してください。';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        departmentName: formData.departmentName,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined
      });
      setFormData({
        departmentName: '',
        startDate: '',
        endDate: ''
      });
      setErrors({});
    }
  };

  const handleInputChange = (field: keyof DepartmentHistoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // モーダルの背景クリックを防ぐ
  const handleBackdropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100"
        onClick={handleModalClick}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {editHistory ? '部署履歴編集' : '部署履歴追加'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-2" />
              部署 *
            </label>
            <select
              value={formData.departmentName}
              onChange={(e) => handleInputChange('departmentName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.departmentName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">部署を選択</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
            {errors.departmentName && <p className="text-red-500 text-sm mt-1">{errors.departmentName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              開始日 *
            </label>
            {console.log("formData.startDate::", formData.startDate)}
            {console.log("formData.startDate?.slice(0, 10)::", formData.startDate?.slice(0, 10))}
            <input
              type="date"
              value={formData.startDate?.slice(0, 10) || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              終了日
            </label>
            <input
              type="date"
              value={formData.endDate?.slice(0, 10) || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
            <p className="text-sm text-gray-500 mt-1">
              空欄の場合は現在所属中として扱われます
            </p>
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {editHistory ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentHistoryModal;
