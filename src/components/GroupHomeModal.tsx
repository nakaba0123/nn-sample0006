import React, { useState, useEffect } from 'react';
import { X, Home, MapPin, Phone, Calendar, Plus, Trash2, Building } from 'lucide-react';
import { GroupHome, GroupHomeFormData } from '../types/GroupHome';

interface GroupHomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GroupHomeFormData) => void;
  editGroupHome?: GroupHome | null;
}

const GroupHomeModal: React.FC<GroupHomeModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editGroupHome 
}) => {
  const [formData, setFormData] = useState<GroupHomeFormData>({
    propertyName: '',
    unitName: '',
    postalCode: '',
    address: '',
    phoneNumber: '',
    commonRoom: '1室',
    residentRooms: [''],
    openingDate: ''
  });

  const [errors, setErrors] = useState<Partial<GroupHomeFormData>>({});

  useEffect(() => {
    if (editGroupHome) {
      setFormData({
        propertyName: editGroupHome.propertyName,
        unitName: editGroupHome.unitName,
        postalCode: editGroupHome.postalCode,
        address: editGroupHome.address,
        phoneNumber: editGroupHome.phoneNumber,
        commonRoom: editGroupHome.commonRoom,
        residentRooms: editGroupHome.residentRooms.length > 0 ? editGroupHome.residentRooms : [''],
        openingDate: editGroupHome.openingDate
      });
    } else {
      setFormData({
        propertyName: '',
        unitName: '',
        postalCode: '',
        address: '',
        phoneNumber: '',
        commonRoom: '1室',
        residentRooms: [''],
        openingDate: ''
      });
    }
  }, [editGroupHome, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<GroupHomeFormData> = {};
    
    if (!formData.propertyName.trim()) {
      newErrors.propertyName = '物件名を入力してください';
    }
    
    if (!formData.unitName.trim()) {
      newErrors.unitName = 'ユニット名を入力してください';
    }
    
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = '郵便番号を入力してください';
    } else if (!/^\d{3}-?\d{4}$/.test(formData.postalCode)) {
      newErrors.postalCode = '正しい郵便番号を入力してください（例：123-4567）';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = '所在地を入力してください';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = '電話番号を入力してください';
    } else if (!/^[\d-]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = '正しい電話番号を入力してください';
    }
    
    if (!formData.openingDate) {
      newErrors.openingDate = '開所日を入力してください';
    }

    // 居室の検証
    const validRooms = formData.residentRooms.filter(room => room.trim() !== '');
    if (validRooms.length === 0) {
      newErrors.residentRooms = '少なくとも1つの居室を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // 空の居室を除外
      const cleanedData = {
        ...formData,
        residentRooms: formData.residentRooms.filter(room => room.trim() !== '')
      };
      
      onSubmit(cleanedData);
      setFormData({
        propertyName: '',
        unitName: '',
        postalCode: '',
        address: '',
        phoneNumber: '',
        commonRoom: '1室',
        residentRooms: [''],
        openingDate: ''
      });
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: keyof GroupHomeFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addResidentRoom = () => {
    setFormData(prev => ({
      ...prev,
      residentRooms: [...prev.residentRooms, '']
    }));
  };

  const removeResidentRoom = (index: number) => {
    if (formData.residentRooms.length > 1) {
      setFormData(prev => ({
        ...prev,
        residentRooms: prev.residentRooms.filter((_, i) => i !== index)
      }));
    }
  };

  const updateResidentRoom = (index: number, value: string) => {
    const newRooms = [...formData.residentRooms];
    newRooms[index] = value;
    handleInputChange('residentRooms', newRooms);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Home className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {editGroupHome ? 'グループホーム情報編集' : 'グループホーム登録'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="w-4 h-4 inline mr-2" />
                物件名 *
              </label>
              <input
                type="text"
                value={formData.propertyName}
                onChange={(e) => handleInputChange('propertyName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.propertyName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="さくらホーム"
              />
              {errors.propertyName && <p className="text-red-500 text-sm mt-1">{errors.propertyName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Home className="w-4 h-4 inline mr-2" />
                ユニット名 *
              </label>
              <input
                type="text"
                value={formData.unitName}
                onChange={(e) => handleInputChange('unitName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.unitName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="1号館"
              />
              {errors.unitName && <p className="text-red-500 text-sm mt-1">{errors.unitName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                郵便番号 *
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleInputChange('postalCode', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.postalCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="123-4567"
              />
              {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                電話番号 *
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="03-1234-5678"
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              所在地 *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="東京都渋谷区○○1-2-3"
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Home className="w-4 h-4 inline mr-2" />
                共用室
              </label>
              <input
                type="text"
                value={formData.commonRoom}
                onChange={(e) => handleInputChange('commonRoom', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="1室"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                開所日 *
              </label>
              <input
                type="date"
                value={formData.openingDate}
                onChange={(e) => handleInputChange('openingDate', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.openingDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.openingDate && <p className="text-red-500 text-sm mt-1">{errors.openingDate}</p>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <Home className="w-4 h-4 inline mr-2" />
                利用者居室 *
              </label>
              <button
                type="button"
                onClick={addResidentRoom}
                className="flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>居室追加</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.residentRooms.map((room, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => updateResidentRoom(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder={`居室${index + 1}（例：101号室）`}
                  />
                  {formData.residentRooms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeResidentRoom(index)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.residentRooms && <p className="text-red-500 text-sm mt-1">{errors.residentRooms}</p>}
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
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              {editGroupHome ? '更新' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupHomeModal;