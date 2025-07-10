import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Home, Plus, Trash2, Clock, FileText, MapPin } from 'lucide-react';
import { User as UserType } from '../types/User';
import { GroupHome } from '../types/GroupHome';
import { ShiftPreference, ShiftPreferenceFormData, GroupHomePreference } from '../types/ShiftPreference';

interface ShiftPreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShiftPreference) => void;
  editPreference?: ShiftPreference | null;
  users: UserType[];
  groupHomes: GroupHome[];
}

const ShiftPreferenceModal: React.FC<ShiftPreferenceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editPreference,
  users,
  groupHomes
}) => {
  const [formData, setFormData] = useState<ShiftPreferenceFormData>({
    userId: '',
    targetYear: new Date().getFullYear(),
    targetMonth: new Date().getMonth() + 1,
    preferences: [],
    notes: ''
  });

  const [errors, setErrors] = useState<Partial<ShiftPreferenceFormData>>({});

  useEffect(() => {
    if (editPreference) {
      setFormData({
        userId: editPreference.userId,
        targetYear: editPreference.targetYear,
        targetMonth: editPreference.targetMonth,
        preferences: editPreference.preferences,
        notes: editPreference.notes || ''
      });
    } else {
      const currentDate = new Date();
      setFormData({
        userId: '',
        targetYear: currentDate.getFullYear(),
        targetMonth: currentDate.getMonth() + 1,
        preferences: [],
        notes: ''
      });
    }
  }, [editPreference, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ShiftPreferenceFormData> = {};
    
    if (!formData.userId) {
      newErrors.userId = '職員を選択してください';
    }
    
    if (formData.preferences.length === 0) {
      newErrors.preferences = '少なくとも1つのグループホームを選択してください';
    }

    // 重複チェック
    const groupHomeIds = formData.preferences.map(p => p.groupHomeId);
    const uniqueIds = new Set(groupHomeIds);
    if (groupHomeIds.length !== uniqueIds.size) {
      newErrors.preferences = '同じグループホームが重複しています';
    }

    // 勤務日数の検証
    const hasInvalidDays = formData.preferences.some(p => p.desiredDays < 0 || p.desiredDays > 31);
    if (hasInvalidDays) {
      newErrors.preferences = '勤務日数は0〜31日の範囲で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const selectedUser = users.find(u => u.id === formData.userId);
      if (!selectedUser) return;

      const now = new Date().toISOString();
      
      const shiftPreference: ShiftPreference = {
        id: editPreference?.id || `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: formData.userId,
        userName: selectedUser.name,
        targetYear: formData.targetYear,
        targetMonth: formData.targetMonth,
        preferences: formData.preferences,
        notes: formData.notes || undefined,
        createdAt: editPreference?.createdAt || now,
        updatedAt: now
      };

      onSubmit(shiftPreference);
      
      if (!editPreference) {
        setFormData({
          userId: '',
          targetYear: new Date().getFullYear(),
          targetMonth: new Date().getMonth() + 1,
          preferences: [],
          notes: ''
        });
      }
      
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: keyof ShiftPreferenceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const addGroupHomePreference = () => {
    const availableGroupHomes = groupHomes.filter(gh => 
      !formData.preferences.some(p => p.groupHomeId === gh.id)
    );
    
    if (availableGroupHomes.length === 0) {
      alert('すべてのグループホームが既に選択されています');
      return;
    }

    const firstAvailable = availableGroupHomes[0];
    const newPreference: GroupHomePreference = {
      groupHomeId: firstAvailable.id,
      groupHomeName: firstAvailable.propertyName,
      unitName: firstAvailable.unitName,
      desiredDays: 0
    };

    handleInputChange('preferences', [...formData.preferences, newPreference]);
  };

  const removeGroupHomePreference = (index: number) => {
    const newPreferences = formData.preferences.filter((_, i) => i !== index);
    handleInputChange('preferences', newPreferences);
  };

  const updateGroupHomePreference = (index: number, field: keyof GroupHomePreference, value: any) => {
    const newPreferences = [...formData.preferences];
    
    if (field === 'groupHomeId') {
      const selectedGroupHome = groupHomes.find(gh => gh.id === value);
      if (selectedGroupHome) {
        newPreferences[index] = {
          ...newPreferences[index],
          groupHomeId: value,
          groupHomeName: selectedGroupHome.propertyName,
          unitName: selectedGroupHome.unitName
        };
      }
    } else {
      newPreferences[index] = {
        ...newPreferences[index],
        [field]: value
      };
    }
    
    handleInputChange('preferences', newPreferences);
  };

  const getMonthName = (month: number) => {
    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return months[month - 1];
  };

  const getTotalDesiredDays = () => {
    return formData.preferences.reduce((sum, pref) => sum + pref.desiredDays, 0);
  };

  // 年月の選択肢を生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {editPreference ? 'シフト希望編集' : 'シフト希望登録'}
              </h2>
              {getTotalDesiredDays() > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 mt-1">
                  総希望日数: {getTotalDesiredDays()}日
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                職員 *
              </label>
              <select
                value={formData.userId}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  errors.userId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={!!editPreference}
              >
                <option value="">職員を選択</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              {errors.userId && <p className="text-red-500 text-sm mt-1">{errors.userId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                対象年 *
              </label>
              <select
                value={formData.targetYear}
                onChange={(e) => handleInputChange('targetYear', Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                対象月 *
              </label>
              <select
                value={formData.targetMonth}
                onChange={(e) => handleInputChange('targetMonth', Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                {months.map(month => (
                  <option key={month} value={month}>{getMonthName(month)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* グループホーム希望 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                <Home className="w-4 h-4 inline mr-2" />
                勤務希望グループホーム *
              </label>
              <button
                type="button"
                onClick={addGroupHomePreference}
                className="flex items-center space-x-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                disabled={formData.preferences.length >= groupHomes.length}
              >
                <Plus className="w-4 h-4" />
                <span>施設追加</span>
              </button>
            </div>

            {formData.preferences.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Home className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">勤務希望のグループホームを追加してください</p>
                <button
                  type="button"
                  onClick={addGroupHomePreference}
                  className="mt-2 text-purple-600 hover:text-purple-700 text-sm underline"
                >
                  施設を追加
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.preferences.map((preference, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-800">勤務希望 {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeGroupHomePreference(index)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="w-4 h-4 inline mr-2" />
                          グループホーム
                        </label>
                        <select
                          value={preference.groupHomeId}
                          onChange={(e) => updateGroupHomePreference(index, 'groupHomeId', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        >
                          <option value="">施設を選択</option>
                          {groupHomes
                            .filter(gh => 
                              gh.id === preference.groupHomeId || 
                              !formData.preferences.some(p => p.groupHomeId === gh.id)
                            )
                            .map(gh => (
                              <option key={gh.id} value={gh.id}>
                                {gh.propertyName} - {gh.unitName}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="w-4 h-4 inline mr-2" />
                          希望勤務日数
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="31"
                          value={preference.desiredDays}
                          onChange={(e) => updateGroupHomePreference(index, 'desiredDays', Number(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {errors.preferences && <p className="text-red-500 text-sm mt-1">{errors.preferences}</p>}
          </div>

          {/* 自由記述欄 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              特記事項・希望休など
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              placeholder="希望休、特記事項、その他の要望があれば記入してください..."
            />
            <p className="text-sm text-gray-500 mt-1">
              任意項目です。希望休や特別な事情がある場合にご記入ください。
            </p>
          </div>

          {/* プレビュー */}
          {formData.preferences.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-3">登録内容プレビュー</h4>
              <div className="text-sm text-purple-700 space-y-2">
                <p><strong>対象:</strong> {formData.targetYear}年{getMonthName(formData.targetMonth)}</p>
                <p><strong>職員:</strong> {users.find(u => u.id === formData.userId)?.name || '未選択'}</p>
                <p><strong>総希望日数:</strong> {getTotalDesiredDays()}日</p>
                <div>
                  <strong>勤務希望:</strong>
                  <ul className="mt-1 space-y-1">
                    {formData.preferences.map((pref, index) => (
                      <li key={index} className="flex justify-between">
                        <span>{pref.groupHomeName} - {pref.unitName}</span>
                        <span>{pref.desiredDays}日</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {formData.notes && (
                  <p><strong>特記事項:</strong> {formData.notes}</p>
                )}
              </div>
            </div>
          )}

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
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              {editPreference ? '更新' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShiftPreferenceModal;