import React, { useState } from 'react';
import { X, Clock, User, Calendar } from 'lucide-react';

interface AttendanceData {
  name: string;
  checkIn: string;
  checkOut: string;
  shiftType: string;
}

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AttendanceData) => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<AttendanceData>({
    name: '',
    checkIn: '',
    checkOut: '',
    shiftType: 'regular'
  });

  const [errors, setErrors] = useState<Partial<AttendanceData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<AttendanceData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '名前を入力してください';
    }
    
    if (!formData.checkIn) {
      newErrors.checkIn = '出勤時刻を入力してください';
    }
    
    if (!formData.checkOut) {
      newErrors.checkOut = '退勤時刻を入力してください';
    }
    
    if (formData.checkIn && formData.checkOut && formData.checkIn >= formData.checkOut) {
      newErrors.checkOut = '退勤時刻は出勤時刻より後にしてください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      setFormData({ name: '', checkIn: '', checkOut: '', shiftType: 'regular' });
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: keyof AttendanceData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
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
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">出勤報告</h2>
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
              <User className="w-4 h-4 inline mr-2" />
              名前
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="山田太郎"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              出勤時刻
            </label>
            <input
              type="time"
              value={formData.checkIn}
              onChange={(e) => handleInputChange('checkIn', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.checkIn ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.checkIn && <p className="text-red-500 text-sm mt-1">{errors.checkIn}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              退勤時刻
            </label>
            <input
              type="time"
              value={formData.checkOut}
              onChange={(e) => handleInputChange('checkOut', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.checkOut ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.checkOut && <p className="text-red-500 text-sm mt-1">{errors.checkOut}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              シフト種別
            </label>
            <select
              value={formData.shiftType}
              onChange={(e) => handleInputChange('shiftType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="regular">通常勤務</option>
              <option value="early">早番</option>
              <option value="late">遅番</option>
              <option value="night">夜勤</option>
              <option value="overtime">残業</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-2">
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
              提出
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceModal;