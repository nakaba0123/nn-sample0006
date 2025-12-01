import React, { useState, useEffect } from 'react';
import { X, Home, Plus, Trash2, Building, Calendar, ArrowRight, Users } from 'lucide-react';
import { GroupHome, ExpansionFormData, ExpansionRecord } from '../types/GroupHome';

interface ExpansionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpansionFormData) => void;
  groupHomes: GroupHome[];
  expansionRecords: ExpansionRecord[];
  editExpansion?: ExpansionRecord | null;
}

const ExpansionModal: React.FC<ExpansionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  groupHomes,
  expansionRecords,
  editExpansion
}) => {
  const [formData, setFormData] = useState<ExpansionFormData>({
    propertyName: '',
    unitName: '',
    expansionType: 'A',
    newRooms: ['201', '202', '203'],
    commonRoom: '共用室A',
    startDate: '2025-04-01'
    facilityCode: '',     // ← ★ 追加
  });

  const [errors, setErrors] = useState<Partial<ExpansionFormData & { commonRoom: string }>>({});

  useEffect(() => {
    if (editExpansion) {
      setFormData({
        propertyName: editExpansion.propertyName,
        unitName: editExpansion.unitName,
        expansionType: editExpansion.expansionType,
        facilityCode: editExpansion?.facilityCode || '',
        newRooms: Array.isArray(editExpansion.newRooms) && editExpansion.newRooms.length > 0
          ? editExpansion.newRooms
          : [''],
        commonRoom: editExpansion.commonRoom || '',
//        startDate: editExpansion.startDate
        startDate: editExpansion.startDate
          ? editExpansion.startDate.split('T')[0] // ← ← ← ここで日付だけ抽出！
          : ''      });
    } else {
      // デフォルト値を設定（物件名は空にして選択を促す）
      const defaultPropertyName = groupHomes.length > 0 ? groupHomes[0].propertyName : '';
      setFormData({
        propertyName: defaultPropertyName,
        unitName: '第1ユニット',
        expansionType: 'A',
        facilityCode: ''
        newRooms: ['201', '202', '203'],
        commonRoom: '共用室A',
        startDate: '2025-04-01'
      });
    }
  }, [editExpansion, isOpen, groupHomes]);

  // 選択された物件の全ユニット名を取得（初期登録分 + 増床タイプAで追加されたユニット）
  const getAllUnitsForProperty = (propertyName: string) => {
    const units = new Set<string>();
    
    // 1. 初期登録されたグループホームのユニット名を追加
    groupHomes
      .filter(gh => gh.propertyName === propertyName)
      .forEach(gh => units.add(gh.unitName));
    
    // 2. 増床タイプAで追加されたユニット名を追加
    expansionRecords
      .filter(exp => exp.propertyName === propertyName && exp.expansionType === 'A')
      .forEach(exp => units.add(exp.unitName));
    
    return Array.from(units).sort();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ExpansionFormData & { commonRoom: string }> = {};
    
    if (!formData.propertyName.trim()) {
      newErrors.propertyName = '物件名を選択してください';
    }
    
    if (!formData.unitName.trim()) {
      newErrors.unitName = 'ユニット名を入力してください';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = '開始日を入力してください';
    }

    // タイプAの場合は共用室が必須
    if (formData.expansionType === 'A' && !formData.commonRoom?.trim()) {
      newErrors.commonRoom = '共用室を入力してください';
    }

    // 居室の検証
    const validRooms = formData.newRooms?.filter(room => room.trim() !== '');
    if (validRooms.length === 0) {
      newErrors.newRooms = '少なくとも1つの居室を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (validateForm()) {
    const cleanedData: ExpansionFormData = {
      ...formData,
      newRooms: formData.newRooms?.filter(room => room.trim() !== ''),
      commonRoom: formData.expansionType === 'A' ? formData.commonRoom : undefined
    };

    // INSERTをawaitで待つ
    await onSubmit(cleanedData);

    // 成功後に再読み込みを呼ぶ（親からfetch関数を渡してる前提）
    if (typeof fetchExpansions === 'function') {
      await fetchExpansions();
    }

    if (!editExpansion) {
      const defaultPropertyName = groupHomes.length > 0 ? groupHomes[0].propertyName : '';
      setFormData({
        propertyName: defaultPropertyName,
        unitName: '第1ユニット',
        expansionType: 'A',
        newRooms: ['201', '202', '203'],
        commonRoom: '共用室A',
        startDate: '2025-04-01'
      });
    }

    setErrors({});
    onClose();
  }
};

  const handleInputChange = (field: keyof ExpansionFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleExpansionTypeChange = (type: 'A' | 'B') => {
    setFormData(prev => ({
      ...prev,
      expansionType: type,
      unitName: type === 'A' ? '第1ユニット' : '', // タイプAは新規入力、タイプBは選択リセット
      commonRoom: type === 'A' ? '共用室A' : undefined // タイプBでは共用室をクリア
    }));
    
    // エラーもクリア
    setErrors(prev => ({
      ...prev,
      unitName: undefined,
      commonRoom: undefined
    }));
  };

  const addNewRoom = () => {
    setFormData(prev => ({
      ...prev,
      newRooms: [...prev.newRooms, '']
    }));
  };

  const removeNewRoom = (index: number) => {
    if ((formData.newRooms?.length ?? 0) > 1) {
      setFormData(prev => ({
        ...prev,
        newRooms: prev.newRooms.filter((_, i) => i !== index)
      }));
    }
  };

  const updateNewRoom = (index: number, value: string) => {
    const newRooms = [...(formData.newRooms ?? [])]; // ← null/undefined 対策
    newRooms[index] = value;
    handleInputChange('newRooms', newRooms);
  };

  const getExpansionTypeDescription = (type: 'A' | 'B') => {
    return type === 'A' 
      ? '別ユニットとして増床（共用室あり）' 
      : '同じユニットで単純増床（共用室は増えない）';
  };

  const propertyNames = [...new Set(groupHomes.map(gh => gh.propertyName))];
  const allUnitsForProperty = getAllUnitsForProperty(formData.propertyName);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {editExpansion ? '増床情報編集' : '既存グループホームへの増床登録'}
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
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Building className="w-5 h-5 text-purple-600" />
              <h3 className="font-medium text-purple-800">
                {editExpansion ? '増床情報の編集' : '増床情報'}
              </h3>
            </div>
            <p className="text-sm text-purple-700">
              {editExpansion 
                ? '既存の増床記録を編集します。' 
                : '既存のグループホームに新しい居室を追加します。増床タイプによって入力項目が変わります。'
              }
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4 inline mr-2" />
              増床する物件名 *
            </label>
            <select
              value={formData.propertyName}
              onChange={(e) => handleInputChange('propertyName', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                errors.propertyName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">物件を選択してください</option>
              {propertyNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {errors.propertyName && <p className="text-red-500 text-sm mt-1">{errors.propertyName}</p>}
            <p className="text-sm text-gray-600 mt-2">
              💡 物件名の修正は「グループホーム情報編集」で行ってください
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <ArrowRight className="w-4 h-4 inline mr-2" />
              増床のタイプ *
            </label>
            <div className="space-y-3">
              <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="expansionType"
                  value="A"
                  checked={formData.expansionType === 'A'}
                  onChange={(e) => handleExpansionTypeChange(e.target.value as 'A' | 'B')}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-800">A：別ユニットとして増床</div>
                  <div className="text-sm text-gray-600">共用室あり - 独立したユニットとして人員配置計算</div>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="expansionType"
                  value="B"
                  checked={formData.expansionType === 'B'}
                  onChange={(e) => handleExpansionTypeChange(e.target.value as 'A' | 'B')}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-800">B：同じユニットで単純増床</div>
                  <div className="text-sm text-gray-600">共用室は増えない - 既存ユニット内で加算計算</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Home className="w-4 h-4 inline mr-2" />
              {formData.expansionType === 'A' ? '新しいユニット名' : '増床するユニット名'} *
            </label>
            
            {formData.expansionType === 'A' ? (
              // タイプA: 新規テキスト入力
              <input
                type="text"
                value={formData.unitName}
                onChange={(e) => handleInputChange('unitName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                  errors.unitName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="新しいユニット名を入力（例：第2ユニット）"
              />
            ) : (
              // タイプB: 全ユニット（初期登録分 + 増床タイプA分）からプルダウン選択
              <div>
                <select
                  value={formData.unitName}
                  onChange={(e) => handleInputChange('unitName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                    errors.unitName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">既存ユニットを選択</option>
                  {allUnitsForProperty.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                {allUnitsForProperty.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    💡 選択可能なユニット: {allUnitsForProperty.join(', ')}
                    <br />
                    （初期登録分 + 増床タイプAで追加されたユニットを含む）
                  </p>
                )}
              </div>
            )}
            {errors.unitName && <p className="text-red-500 text-sm mt-1">{errors.unitName}</p>}
          </div>

{/* Facility Code（タイプAの場合のみ表示） */}
{formData.expansionType === 'A' && (
  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      <Home className="w-4 h-4 inline mr-2" />
      番号（facility_code） *
    </label>
    <input
      type="text"
      value={formData.facilityCode || ''}
      onChange={(e) => handleInputChange('facilityCode', e.target.value)}
      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
        errors.facilityCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
      }`}
      placeholder="例：GH-101、A-02 など"
    />
    {errors.facilityCode && (
      <p className="text-red-500 text-sm mt-1">{errors.facilityCode}</p>
    )}
    <p className="text-sm text-blue-700 mt-2">
      💡 別ユニットとして登録する場合、新しい番号を指定します。
    </p>
  </div>
)}

          {/* 共用室入力欄（タイプAの場合のみ表示） */}
          {formData.expansionType === 'A' && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                共用室 *
              </label>
              <input
                type="text"
                value={formData.commonRoom || ''}
                onChange={(e) => handleInputChange('commonRoom', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                  errors.commonRoom ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="共用室の部屋番号を入力（例：共用室A、101号室など）"
              />
              {errors.commonRoom && <p className="text-red-500 text-sm mt-1">{errors.commonRoom}</p>}
              <p className="text-sm text-green-700 mt-2">
                💡 別ユニットとして増床する場合、専用の共用室が必要です
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                <Home className="w-4 h-4 inline mr-2" />
                新しい利用者居室 *
              </label>
              <button
                type="button"
                onClick={addNewRoom}
                className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>居室追加</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.newRooms?.map((room, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => updateNewRoom(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder={`新居室${index + 1}（例：${201 + index}号室）`}
                  />
                  {(formData.newRooms?.length ?? 0)> 1 && (
                    <button
                      type="button"
                      onClick={() => removeNewRoom(index)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.newRooms && <p className="text-red-500 text-sm mt-1">{errors.newRooms}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              開始日 *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">
              {editExpansion ? '編集内容プレビュー' : '登録内容プレビュー'}
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>物件:</strong> {formData.propertyName}</p>
              <p><strong>ユニット:</strong> {formData.unitName}</p>
              <p><strong>タイプ:</strong> {formData.expansionType} - {getExpansionTypeDescription(formData.expansionType)}</p>
              {formData.expansionType === 'A' && formData.commonRoom && (
                <p><strong>共用室:</strong> {formData.commonRoom}</p>
              )}
              <p><strong>新居室:</strong> {formData.newRooms?.filter(r => r.trim()).join(', ')}</p>
              <p><strong>開始日:</strong> {formData.startDate}</p>
            </div>
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
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              {editExpansion ? '更新' : '増床登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpansionModal;
