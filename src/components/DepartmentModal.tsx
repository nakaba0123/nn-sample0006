import React, { useState, useEffect } from 'react';
import { X, Building } from 'lucide-react';
import { Department, DepartmentFormData } from '../types/Department';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => void;
  editDepartment?: Department | null;
}

const DepartmentModal: React.FC<DepartmentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editDepartment 
}) => {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: ''
  });

  const [errors, setErrors] = useState<Partial<DepartmentFormData>>({});

  useEffect(() => {
    if (editDepartment) {
      setFormData({
        name: editDepartment.name
      });
    } else {
      setFormData({
        name: ''
      });
    }
  }, [editDepartment, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<DepartmentFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '部署名を入力してください';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '部署名は2文字以上で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        name: formData.name.trim()
      });
      setFormData({ name: '' });
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: keyof DepartmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {editDepartment ? '部署情報編集' : '新規部署登録'}
            </h2>
          </div>
          <button
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
              部署名 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="営業部、開発部など"
              maxLength={50}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            <p className="text-sm text-gray-500 mt-1">
              職員登録時の部署選択肢として使用されます
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
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {editDepartment ? '更新' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentModal;