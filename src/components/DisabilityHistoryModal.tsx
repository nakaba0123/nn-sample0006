import React, { useState, useEffect } from 'react';
import { X, Shield, Calendar } from 'lucide-react';
import { DisabilityHistory, DisabilityHistoryFormData } from '../types/Resident';

interface DisabilityHistoryModalProps {
  residentId: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DisabilityHistoryFormData) => void;
  editHistory?: DisabilityHistory | null;
  existingHistory: DisabilityHistory[];
}

const DisabilityHistoryModal: React.FC<DisabilityHistoryModalProps> = ({
  residentId,
  isOpen,
  onClose,
  onSubmit,
  editHistory,
  existingHistory
}) => {
  // ここで residentId が使えるようになります！
  console.log("? residentId:", residentId); // ← 動作確認にも便利！
  const [formData, setFormData] = useState<DisabilityHistoryFormData>({
    disabilityLevel: '1以下',
    startDate: '',
    endDate: ''
  });

  const [errors, setErrors] = useState<Partial<DisabilityHistoryFormData>>({});

  useEffect(() => {
    if (editHistory) {
      setFormData({
        residentId, // ← これを入れる！ 
        disabilityLevel: editHistory.disabilityLevel,
        startDate: editHistory.startDate,
        endDate: editHistory.endDate || ''
      });
    } else {
      setFormData({
        residentId, // ← これを入れる！
        disabilityLevel: '1以下',
        startDate: '',
        endDate: ''
      });
    }
  }, [editHistory, isOpen]);

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

const validateForm = (): boolean => {
  const newErrors: Partial<DisabilityHistoryFormData> = {};

  if (!formData.startDate) {
    newErrors.startDate = '開始日を入力してください';
  }

  if (formData.endDate && formData.startDate && formData.endDate <= formData.startDate) {
    newErrors.endDate = '終了日は開始日より後にしてください';
  }

  console.log("DisabilityHistoryModalのformData:::", formData);
  console.log("formData.startDate:", formData.startDate);
  if (formData.startDate) {
    console.log("1だよ");
    // 1. existingHistory の日付を安全に Date に変換
    const safeHistory = existingHistory
      .filter(h => h.startDate) // startDate が存在するもののみ
      .map(h => ({
        ...h,
        startDateObj: new Date(h.startDate),
        endDateObj: h.endDate ? new Date(h.endDate) : null
      }));

    console.log("safeHistory::", safeHistory);
    // 2. 最新履歴を取得
    console.log("2だよ");
    const sortedHistory = safeHistory.sort(
      (a, b) => b.startDateObj.getTime() - a.startDateObj.getTime()
    );
    const latestHistory = sortedHistory[0] || null;

    // 3. 期間重複チェック
    console.log("3だよ");
    console.log("editHistory::", editHistory);
    console.log("history.id::", history.id);
    console.log("editHistory.id::", editHistory.id);

    const conflictingHistory = safeHistory.find(history => {
      console.log("3-1だよ");
      console.log("editHistory::", editHistory);
      console.log("history.id::", history.id);
      console.log("editHistory.id::", editHistory.id);
      if (editHistory && history.id === editHistory.id) return false;

      const newStart = new Date(formData.startDate);
      const newEnd = formData.endDate ? new Date(formData.endDate) : null;
      const existingStart = history.startDateObj;
      const existingEnd = history.endDateObj;

      console.log("newStart::", newStart);
      console.log("newEnd::", newEnd);
      console.log("existingStart::", existingStart);
      console.log("existingEnd::", existingEnd);


      if (newEnd && existingEnd) {
        return newStart <= existingEnd && newEnd >= existingStart;
      } else if (!newEnd && !existingEnd) {
        return true;
      } else if (!newEnd) {
        return newStart <= (existingEnd || new Date());
      } else if (!existingEnd) {
        return newEnd >= existingStart;
      }

      return false;
    });

    if (conflictingHistory) {
      newErrors.startDate = '他の障害支援区分履歴と期間が重複しています';
    }

    // 4. 現在適用中の区分が複数ないかチェック
    console.log("4だよ");
    if (!formData.endDate) {
      const currentLevels = safeHistory.filter(history =>
        !history.endDateObj && (!editHistory || history.id !== editHistory.id)
      );

      if (currentLevels.length > 0) {
        newErrors.endDate = '現在適用中の障害支援区分は1つまでです。他の履歴に終了日を設定してください。';
      }
    }

    // 5. 最新履歴から開始日制限のチェック（追加予定の場合）
    console.log("5だよ");
    if (latestHistory && !editHistory) {
      const latestEnd = latestHistory.endDateObj;
      if (latestEnd && new Date(formData.startDate) < latestEnd) {
        newErrors.startDate = `開始日は最新履歴の終了日 ${latestHistory.endDate} 以降にしてください`;
      }
    }
  } else {
    console.log("いけないもーん");
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log("DisabilityHistoryModalのformData", formData);

      onSubmit({
        residentId, // ?? これを追加！
        disabilityLevel: formData.disabilityLevel,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined
      });
      setFormData({
        disabilityLevel: '1以下',
        startDate: '',
        endDate: ''
      });
      setErrors({});
    }
  };

  const handleInputChange = (field: keyof DisabilityHistoryFormData, value: string) => {
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

  console.log("isOpen:", isOpen);
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
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {editHistory ? '障害支援区分履歴編集' : '障害支援区分履歴追加'}
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
              <Shield className="w-4 h-4 inline mr-2" />
              障害支援区分 *
            </label>
            <select
              value={formData.disabilityLevel}
              onChange={(e) => handleInputChange('disabilityLevel', e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="1以下">1以下</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
            <div className="mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDisabilityLevelColor(formData.disabilityLevel)}`}>
                <Shield className="w-3 h-3 mr-1" />
                障害支援区分 {formData.disabilityLevel}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              適用開始日 *
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              適用終了日
            </label>
            <input
              type="date"
                value={
                (formData.endDate === '0000-00-00' || formData.endDate === '1899-11-30')
                  ? ''
                  : formData.endDate
              }
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
                errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
            <p className="text-sm text-gray-500 mt-1">
              空欄の場合は現在適用中として扱われます
            </p>
          </div>

          {/* プレビュー */}
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <h4 className="text-sm font-medium text-purple-800 mb-2">適用期間プレビュー</h4>
            <div className="text-sm text-purple-700">
              <p>
                <strong>期間:</strong> {formData.startDate ? new Date(formData.startDate).toLocaleDateString('ja-JP') : '未設定'} 
                ～ {formData.endDate ? new Date(formData.endDate).toLocaleDateString('ja-JP') : '現在'}
              </p>
              <p>
                <strong>区分:</strong> {formData.disabilityLevel}
                {!formData.endDate && <span className="text-green-700 ml-2">（現在適用中）</span>}
              </p>
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
              {editHistory ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisabilityHistoryModal;
