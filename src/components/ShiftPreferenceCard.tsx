import React from 'react';
import { Calendar, User, Home, Clock, Edit, Trash2, FileText, MapPin } from 'lucide-react';
import { ShiftPreference } from '../types/ShiftPreference';

interface ShiftPreferenceCardProps {
  preference: ShiftPreference;
  onEdit: (preference: ShiftPreference) => void;
  onDelete: (preferenceId: string) => void;
}

const ShiftPreferenceCard: React.FC<ShiftPreferenceCardProps> = ({ 
  preference, 
  onEdit, 
  onDelete 
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getMonthName = (month: number) => {
    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return months[month - 1];
  };

  const getTotalDesiredDays = () => {
    return preference.preferences.reduce((sum, pref) => sum + pref.desiredDays, 0);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
            {getInitials(preference.userName)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{preference.userName}</h3>
            <p className="text-sm text-gray-500">
              {preference.targetYear}年{getMonthName(preference.targetMonth)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
            総{getTotalDesiredDays()}日
          </span>
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(preference)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-50 text-purple-600 transition-colors"
              title="編集"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(preference.id)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-colors"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 希望勤務先一覧 */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <Home className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">希望勤務先</span>
          <span className="text-xs text-gray-500">({preference.preferences.length}施設)</span>
        </div>
        
        <div className="space-y-2">
          {preference.preferences.map((ghPref, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-800 text-sm">{ghPref.groupHomeName}</p>
                  <p className="text-xs text-gray-500">{ghPref.unitName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-purple-700">{ghPref.desiredDays}日</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 自由記述欄 */}
      {preference.notes && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800 mb-1">特記事項・希望休</p>
              <p className="text-sm text-blue-700">{preference.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* フッター情報 */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>登録: {formatDate(preference.createdAt)}</span>
            {preference.updatedAt !== preference.createdAt && (
              <span>更新: {formatDate(preference.updatedAt)}</span>
            )}
          </div>
          <span>ID: {preference.id.slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
};

export default ShiftPreferenceCard;