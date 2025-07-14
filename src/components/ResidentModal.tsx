import React, { useState, useEffect } from 'react';
import { X, User, Users, Home, Calendar, Shield, MapPin, Hash, Plus, History } from 'lucide-react';
import { Resident, ResidentFormData, DisabilityHistory, DisabilityHistoryFormData } from '../types/Resident';
import { GroupHome, ExpansionRecord } from '../types/GroupHome';
import DisabilityHistoryCard from './DisabilityHistoryCard';
import DisabilityHistoryModal from './DisabilityHistoryModal';

interface ResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Resident) => void;
  editResident?: Resident | null;
  groupHomes: GroupHome[];
  expansionRecords: ExpansionRecord[];
}

const ResidentModal: React.FC<ResidentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editResident,
  groupHomes,
  expansionRecords 
}) => {
  const [formData, setFormData] = useState<ResidentFormData>({
    name: '',
    nameKana: '',
    disabilityLevel: '1以下',
    disabilityStartDate: '',
    groupHomeId: '',
    roomNumber: '',
    moveInDate: '',
    moveOutDate: ''
  });

  const [disabilityHistory, setDisabilityHistory] = useState<DisabilityHistory[]>([]);
  const [isDisabilityHistoryModalOpen, setIsDisabilityHistoryModalOpen] = useState(false);
  const [editingDisabilityHistory, setEditingDisabilityHistory] = useState<DisabilityHistory | null>(null);
  const [errors, setErrors] = useState<Partial<ResidentFormData>>({});

  useEffect(() => {
    if (editResident) {
      // 現在の障害支援区分を履歴から取得
      const currentDisability = editResident.disabilityHistory.find(h => !h.endDate)?.disabilityLevel || editResident.disabilityLevel;
      
      setFormData({
        name: editResident.name,
        nameKana: editResident.nameKana,
        disabilityLevel: currentDisability,
        disabilityStartDate: editResident.disabilityHistory[0]?.startDate || '',
        groupHomeId: editResident.groupHomeId,
        roomNumber: editResident.roomNumber,
        moveInDate: editResident.moveInDate || '',
        moveOutDate: editResident.moveOutDate || ''
      });
      setDisabilityHistory(editResident.disabilityHistory);
    } else {
      setFormData({
        name: '',
        nameKana: '',
        disabilityLevel: '1以下',
        disabilityStartDate: '',
        groupHomeId: '',
        roomNumber: '',
        moveInDate: '',
        moveOutDate: ''
      });
      setDisabilityHistory([]);
    }
  }, [editResident, isOpen]);

  // ステータスを自動判定する関数
  const getAutoStatus = (moveOutDate?: string): 'active' | 'inactive' => {
    if (!moveOutDate) return 'active';
    const today = new Date();
    const moveOut = new Date(moveOutDate);
    return moveOut <= today ? 'inactive' : 'active';
  };

  // ひらがな検証関数を改善
  const isValidHiragana = (text: string): boolean => {
    if (!text.trim()) return false;
    
    // ひらがな、長音符（ー）、スペース（全角・半角）のみを許可
    const hiraganaPattern = /^[\u3041-\u3096\u30FC\s　]+$/;
    
    return hiraganaPattern.test(text.trim());
  };

  // 全ユニット（初期登録分 + 増床タイプA分）を取得
  const getAllUnits = () => {
    const units = new Map<string, { id: string; propertyName: string; unitName: string }>();
    
    // 1. 初期登録されたグループホームのユニットを追加
    groupHomes.forEach(gh => {
      const key = `${gh.propertyName}-${gh.unitName}`;
      units.set(key, {
        id: gh.id,
        propertyName: gh.propertyName,
        unitName: gh.unitName
      });
    });
    
    // 2. 増床タイプAで追加されたユニットを追加
    expansionRecords
      .filter(exp => exp.expansionType === 'A')
      .forEach(exp => {
        const key = `${exp.propertyName}-${exp.unitName}`;
        // 既存のユニットと重複しない場合のみ追加
        if (!units.has(key)) {
          units.set(key, {
            id: `expansion_${exp.id}`, // 増床記録のIDを使用
            propertyName: exp.propertyName,
            unitName: exp.unitName
          });
        }
      });
    
    return Array.from(units.values()).sort((a, b) => {
      // 物件名でソート、同じ物件名の場合はユニット名でソート
      if (a.propertyName !== b.propertyName) {
        return a.propertyName.localeCompare(b.propertyName);
      }
      return a.unitName.localeCompare(b.unitName);
    });
  };

  // 選択されたユニットの情報を取得
  const getSelectedUnit = () => {
    const allUnits = getAllUnits();
    return allUnits.find(unit => unit.id === formData.groupHomeId);
  };

  // 利用可能な部屋番号を取得（初期登録分 + 増床分）
  const getAvailableRooms = () => {
    const selectedUnit = getSelectedUnit();
    if (!selectedUnit) return [];

    const rooms = new Set<string>();
    
    // 1. 初期登録されたグループホームの部屋を追加
    const matchingGroupHomes = groupHomes.filter(gh => 
      gh.propertyName === selectedUnit.propertyName && 
      gh.unitName === selectedUnit.unitName
    );
    
    matchingGroupHomes.forEach(gh => {
      gh.residentRooms.forEach(room => rooms.add(room));
    });
    
    // 2. 増床記録から部屋を追加
    const matchingExpansions = expansionRecords.filter(exp => 
      exp.propertyName === selectedUnit.propertyName && 
      exp.unitName === selectedUnit.unitName
    );
    
    matchingExpansions.forEach(exp => {
      exp.newRooms.forEach(room => rooms.add(room));
    });
    
    return Array.from(rooms).sort((a, b) => {
      // 数字部分で比較してソート
      const aNum = parseInt(a.replace(/\D/g, ''), 10);
      const bNum = parseInt(b.replace(/\D/g, ''), 10);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.localeCompare(b);
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ResidentFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '利用者名を入力してください';
    }
    
    if (!formData.nameKana.trim()) {
      newErrors.nameKana = 'よみがなを入力してください';
    } else if (!isValidHiragana(formData.nameKana)) {
      newErrors.nameKana = 'よみがなはひらがなで入力してください';
    }
    
    if (!formData.groupHomeId) {
      newErrors.groupHomeId = 'グループホームを選択してください';
    }
    
    if (!formData.roomNumber) {
      newErrors.roomNumber = '部屋番号を選択してください';
    }

    // 新規登録時は初期障害支援区分の開始日が必須
    if (!editResident && !formData.disabilityStartDate) {
      newErrors.disabilityStartDate = '障害支援区分の開始日を入力してください';
    }

    // 退居日の検証
    if (formData.moveOutDate && formData.moveInDate) {
      if (formData.moveOutDate <= formData.moveInDate) {
        newErrors.moveOutDate = '退居日は入居日より後にしてください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const selectedUnit = getSelectedUnit();
      if (!selectedUnit) return;

      const now = new Date().toISOString();
      const autoStatus = getAutoStatus(formData.moveOutDate);

      // 新規登録の場合は初期障害支援区分履歴を作成
      let finalDisabilityHistory = disabilityHistory;
      
      if (!editResident && formData.disabilityLevel && formData.disabilityStartDate) {
        const initialHistory: DisabilityHistory = {
          id: `disability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          disabilityLevel: formData.disabilityLevel,
          startDate: formData.disabilityStartDate,
          createdAt: new Date().toISOString()
        };
        finalDisabilityHistory = [initialHistory];
      }

      // 現在の障害支援区分を履歴から取得
      const currentDisabilityLevel = finalDisabilityHistory.find(h => !h.endDate)?.disabilityLevel || formData.disabilityLevel;

      const residentData: Resident = {
        id: editResident?.id || `resident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name.trim(),
        nameKana: formData.nameKana.trim(),
        disabilityLevel: currentDisabilityLevel,
        disabilityHistory: finalDisabilityHistory,
        groupHomeId: formData.groupHomeId,
        groupHomeName: selectedUnit.propertyName,
        unitName: selectedUnit.unitName,
        roomNumber: formData.roomNumber,
        moveInDate: formData.moveInDate || undefined,
        moveOutDate: formData.moveOutDate || undefined,
        status: autoStatus,
        createdAt: editResident?.createdAt || now,
        updatedAt: now
      };

      onSubmit(residentData);
      
      if (!editResident) {
        setFormData({
          name: '',
          nameKana: '',
          disabilityLevel: '1以下',
          disabilityStartDate: '',
          groupHomeId: '',
          roomNumber: '',
          moveInDate: '',
          moveOutDate: ''
        });
        setDisabilityHistory([]);
      }
      
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: keyof ResidentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // よみがな入力時のリアルタイム検証とガイダンス
  const handleKanaChange = (value: string) => {
    setFormData(prev => ({ ...prev, nameKana: value }));
    
    // エラーをクリア
    if (errors.nameKana) {
      setErrors(prev => ({ ...prev, nameKana: undefined }));
    }
  };

  // グループホームが変更されたときに部屋番号をリセット
  const handleGroupHomeChange = (groupHomeId: string) => {
    setFormData(prev => ({
      ...prev,
      groupHomeId,
      roomNumber: '' // 部屋番号をリセット
    }));
    if (errors.groupHomeId) {
      setErrors(prev => ({ ...prev, groupHomeId: undefined }));
    }
    if (errors.roomNumber) {
      setErrors(prev => ({ ...prev, roomNumber: undefined }));
    }
  };

  // 障害支援区分履歴の管理
  const handleDisabilityHistorySubmit = (data: DisabilityHistoryFormData) => {
    if (editingDisabilityHistory) {
      // 編集
      setDisabilityHistory(prev => prev.map(history => 
        history.id === editingDisabilityHistory.id 
          ? { ...history, ...data }
          : history
      ));
      setEditingDisabilityHistory(null);
    } else {
      // 新規追加
      const newHistory: DisabilityHistory = {
        id: `disability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date().toISOString()
      };
      setDisabilityHistory(prev => [...prev, newHistory]);
    }
    setIsDisabilityHistoryModalOpen(false);
  };

  const handleEditDisabilityHistory = (history: DisabilityHistory) => {
    setEditingDisabilityHistory(history);
    setIsDisabilityHistoryModalOpen(true);
  };

  const handleDeleteDisabilityHistory = (historyId: string) => {
    if (window.confirm('この障害支援区分履歴を削除してもよろしいですか？')) {
      setDisabilityHistory(prev => prev.filter(h => h.id !== historyId));
    }
  };

  const handleAddDisabilityHistory = () => {
    setEditingDisabilityHistory(null);
    setIsDisabilityHistoryModalOpen(true);
  };

  const handleCloseDisabilityHistoryModal = () => {
    setIsDisabilityHistoryModalOpen(false);
    setEditingDisabilityHistory(null);
  };

  const allUnits = getAllUnits();
  const selectedUnit = getSelectedUnit();
  const availableRooms = getAvailableRooms();
  const autoStatus = getAutoStatus(formData.moveOutDate);

  const getStatusDisplay = (status: 'active' | 'inactive') => {
    return status === 'active' 
      ? { text: '入居中', color: 'text-green-700 bg-green-100' }
      : { text: '退居済み', color: 'text-red-700 bg-red-100' };
  };

  const statusDisplay = getStatusDisplay(autoStatus);

  // よみがなの入力状態を判定
  const getKanaInputState = () => {
    if (!formData.nameKana.trim()) return 'empty';
    if (isValidHiragana(formData.nameKana)) return 'valid';
    return 'invalid';
  };

  const kanaInputState = getKanaInputState();

  // 現在の障害支援区分を取得
  const getCurrentDisabilityLevel = () => {
    const currentHistory = disabilityHistory.find(h => !h.endDate);
    return currentHistory?.disabilityLevel || '未設定';
  };

  const getDisabilityHistoryCount = () => {
    return disabilityHistory.length;
  };

  const getDisabilityLevelColor = (level: string) => {
    const colorMap: { [key: string]: string } = {
      '1以下': 'bg-blue-100 text-blue-700',
      '2': 'bg-green-100 text-green-700',
      '3': 'bg-yellow-100 text-yellow-700',
      '4': 'bg-orange-100 text-orange-700',
      '5': 'bg-red-100 text-red-700',
      '6': 'bg-purple-100 text-purple-700'
    };
    return colorMap[level] || 'bg-gray-100 text-gray-700';
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {editResident ? '利用者情報編集' : '新規利用者登録'}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  {formData.moveOutDate && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                      {statusDisplay.text}（自動判定）
                    </span>
                  )}
                  {editResident && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDisabilityLevelColor(getCurrentDisabilityLevel())}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      現在: 区分{getCurrentDisabilityLevel()}
                    </span>
                  )}
                </div>
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
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                基本情報
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    利用者名 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="山田太郎"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    よみがな *
                  </label>
                  <input
                    type="text"
                    value={formData.nameKana}
                    onChange={(e) => handleKanaChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.nameKana ? 'border-red-300 bg-red-50' : 
                      kanaInputState === 'valid' ? 'border-green-300 bg-green-50' :
                      kanaInputState === 'invalid' ? 'border-amber-300 bg-amber-50' :
                      'border-gray-300'
                    }`}
                    placeholder="やまだたろう"
                  />
                  {errors.nameKana && <p className="text-red-500 text-sm mt-1">{errors.nameKana}</p>}
                  
                  {/* リアルタイム入力ガイダンス */}
                  <div className="mt-2">
                    {kanaInputState === 'valid' && formData.nameKana.trim() && (
                      <p className="text-green-600 text-sm flex items-center">
                        <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs">✓</span>
                        </span>
                        正しいひらがなで入力されています
                      </p>
                    )}
                    {kanaInputState === 'invalid' && (
                      <p className="text-amber-600 text-sm flex items-center">
                        <span className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs">!</span>
                        </span>
                        ひらがなで入力してください（例: やまだたろう）
                      </p>
                    )}
                    {kanaInputState === 'empty' && (
                      <p className="text-gray-500 text-sm">
                        ひらがなで入力してください（例: やまだたろう）
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 障害支援区分設定 */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-purple-800">障害支援区分</h3>
                  {editResident && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      現在: 区分{getCurrentDisabilityLevel()}
                    </span>
                  )}
                </div>
                {editResident && (
                  <button
                    type="button"
                    onClick={handleAddDisabilityHistory}
                    className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>履歴追加</span>
                  </button>
                )}
              </div>

              {!editResident ? (
                // 新規登録時：初期区分設定
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      初期障害支援区分 *
                    </label>
                    <select
                      value={formData.disabilityLevel}
                      onChange={(e) => handleInputChange('disabilityLevel', e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      <option value="1以下">1以下</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      適用開始日 *
                    </label>
                    <input
                      type="date"
                      value={formData.disabilityStartDate}
                      onChange={(e) => handleInputChange('disabilityStartDate', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.disabilityStartDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.disabilityStartDate && <p className="text-red-500 text-sm mt-1">{errors.disabilityStartDate}</p>}
                  </div>
                </div>
              ) : (
                // 編集時：履歴表示
                <div>
                  {disabilityHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">障害支援区分履歴がありません</p>
                      <p className="text-gray-400 text-xs">「履歴追加」ボタンから追加してください</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {disabilityHistory
                        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                        .map((history) => (
                          <DisabilityHistoryCard
                            key={history.id}
                            history={history}
                            onEdit={handleEditDisabilityHistory}
                            onDelete={handleDeleteDisabilityHistory}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 入居先情報 */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-medium text-green-800 mb-4 flex items-center">
                <Home className="w-5 h-5 mr-2" />
                入居先情報
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Home className="w-4 h-4 inline mr-2" />
                    入居するグループホーム *
                  </label>
                  <select
                    value={formData.groupHomeId}
                    onChange={(e) => handleGroupHomeChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.groupHomeId ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">グループホームを選択</option>
                    {allUnits.map(unit => (
                      <option key={unit.id} value={unit.id}>
                        {unit.propertyName} - {unit.unitName}
                        {String(unit.id).startsWith('expansion_') && ' (増床)'}
                      </option>
                    ))}
                  </select>
                  {errors.groupHomeId && <p className="text-red-500 text-sm mt-1">{errors.groupHomeId}</p>}
                  <p className="text-sm text-gray-600 mt-1">
                    💡 初期登録分と増床で追加されたユニットを含む全てのユニットが表示されます
                  </p>
                </div>

                {selectedUnit && (
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">選択中のグループホーム</span>
                      {formData.groupHomeId.startsWith('expansion_') && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          増床ユニット
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>物件名:</strong> {selectedUnit.propertyName}</p>
                      <p><strong>ユニット:</strong> {selectedUnit.unitName}</p>
                      <p><strong>利用可能部屋数:</strong> {availableRooms.length}室</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Hash className="w-4 h-4 inline mr-2" />
                    入居する部屋番号 *
                  </label>
                  <select
                    value={formData.roomNumber}
                    onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.roomNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={!formData.groupHomeId}
                  >
                    <option value="">
                      {formData.groupHomeId ? '部屋番号を選択' : 'まずグループホームを選択してください'}
                    </option>
                    {availableRooms.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                  {errors.roomNumber && <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>}
                  {formData.groupHomeId && availableRooms.length === 0 && (
                    <p className="text-amber-600 text-sm mt-1">
                      このグループホームには利用可能な部屋がありません
                    </p>
                  )}
                  {formData.groupHomeId && availableRooms.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      💡 初期登録分と増床で追加された部屋を含む全ての部屋が表示されます
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 入退居日 */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h3 className="font-medium text-orange-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                入退居日
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    入居日
                  </label>
                  <input
                    type="date"
                    value={formData.moveInDate}
                    onChange={(e) => handleInputChange('moveInDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <p className="text-sm text-gray-500 mt-1">空欄でも登録可能です</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    退居日
                  </label>
                  <input
                    type="date"
                    value={formData.moveOutDate}
                    onChange={(e) => handleInputChange('moveOutDate', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.moveOutDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.moveOutDate && <p className="text-red-500 text-sm mt-1">{errors.moveOutDate}</p>}
                  <p className="text-sm text-gray-500 mt-1">空欄の場合は入居中として扱われます</p>
                </div>
              </div>
            </div>

            {/* ステータス表示（自動判定） */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-800">在籍ステータス（自動判定）</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formData.moveOutDate 
                        ? `退居日: ${new Date(formData.moveOutDate).toLocaleDateString('ja-JP')}` 
                        : '退居日未設定'
                      }
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 退居日が設定されている場合、その日付に基づいて自動的にステータスが判定されます
                  </p>
                </div>
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
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                {editResident ? '更新' : '登録'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 障害支援区分履歴モーダル - より高いz-indexで表示 */}
      <DisabilityHistoryModal
        isOpen={isDisabilityHistoryModalOpen}
        onClose={handleCloseDisabilityHistoryModal}
        onSubmit={handleDisabilityHistorySubmit}
        editHistory={editingDisabilityHistory}
        existingHistory={disabilityHistory}
      />
    </>
  );
};

export default ResidentModal;
