import React from 'react';
import { User, Home, Calendar, Edit, Trash2, MapPin, Hash, UserCheck, UserX, Shield, History } from 'lucide-react';
import { Resident } from '../types/Resident';

interface ResidentCardProps {
  resident: Resident;
  onEdit: (resident: Resident) => void;
  onDelete: (residentId: string) => void;
}

const ResidentCard: React.FC<ResidentCardProps> = ({ resident, onEdit, onDelete }) => {
  console.log('ResidentCard の resident:', resident); // ★ここ！
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // 在籍状況の自動判定
  const getAutoStatus = (): 'active' | 'inactive' => {
    if (!resident.moveOutDate) return 'active';
    const today = new Date();
    const moveOut = new Date(resident.moveOutDate);
    return moveOut <= today ? 'inactive' : 'active';
  };

  const getStatusColor = (status: 'active' | 'inactive') => {
    return status === 'active' 
      ? 'bg-green-100 text-green-700 border-green-200' 
      : 'bg-red-100 text-red-700 border-red-200';
  };

  const getStatusText = (status: 'active' | 'inactive') => {
    return status === 'active' ? '入居中' : '退居済み';
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

  const autoStatus = getAutoStatus();
  const isStatusMismatch = resident.status !== autoStatus;

  // 障害支援区分履歴の数を取得
  const getDisabilityHistoryCount = () => {
    console.log("resident.disabilityHistory", resident.disabilityHistory);
    return resident.disabilityHistory?.length || 0;
  };

  // 現在の障害支援区分を取得
const getCurrentDisabilityLevel = () => {
  const currentHistory = resident.disabilityHistory?.find(
    h =>
      !h.endDate || 
      h.endDate === '1899-11-30T00:00:00.000Z' ||
      h.endDate === '0000-00-00' // ← 予備的に対応
  );
  console.log("👀 currentHistory:", currentHistory);
  return currentHistory?.disabilityLevel || resident.disabilityLevel;
};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
            {getInitials(resident.name)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{resident.name}</h3>
            <p className="text-sm text-gray-500">{resident.nameKana}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(autoStatus)}`}>
            {autoStatus === 'active' ? (
              <UserCheck className="w-3 h-3 inline mr-1" />
            ) : (
              <UserX className="w-3 h-3 inline mr-1" />
            )}
            {getStatusText(autoStatus)}
          </span>
          {isStatusMismatch && (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              要確認
            </span>
          )}
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(resident)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors"
              title="編集"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(resident.id)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-colors"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 障害支援区分 */}
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getDisabilityLevelColor(getCurrentDisabilityLevel())}`}>
            <Shield className="w-3 h-3 mr-1" />
            障害支援区分 {getCurrentDisabilityLevel()}
          </span>
          {getDisabilityHistoryCount() > 1 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              <History className="w-3 h-3 inline mr-1" />
              履歴{getDisabilityHistoryCount()}件
            </span>
          )}
        </div>
      </div>

      {/* 基本情報 */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <Home className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{resident.groupHomeName}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{resident.unitName}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Hash className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">部屋番号: {resident.roomNumber}</span>
        </div>
      </div>

      {/* 入退居日 */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        {resident.moveInDate && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">入居: {formatDate(resident.moveInDate)}</span>
          </div>
        )}
        {resident.moveOutDate && (
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">退居: {formatDate(resident.moveOutDate)}</span>
          </div>
        )}
      </div>

      {/* ステータス不一致の警告 */}
      {isStatusMismatch && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-700">
            ⚠️ ステータスと退居日が一致していません
          </p>
        </div>
      )}

      {/* 障害支援区分履歴情報 */}
      {getDisabilityHistoryCount() > 0 && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-2 text-sm">
            <History className="w-4 h-4 text-purple-600" />
            <span className="text-purple-800 font-medium">
              障害支援区分履歴: {getDisabilityHistoryCount()}件
            </span>
          </div>
          <div className="mt-2 text-xs text-purple-700">
{resident && (
  (resident.disabilityHistory ?? [])
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 2)
    .map((history, index) => (
      <div key={history.id} className="flex justify-between">
        <span>
          区分{history.level === 1 ? '1以下' : history.level} 
        </span>
        <span>
          {formatDate(history.startDate)} - 
          {(!history.endDate ||
            history.endDate.startsWith('1899-11-30') ||
            history.endDate.startsWith('0000-00-00')) 
            ? '現在' 
            : formatDate(history.endDate)}
        </span>
      </div>
    ))
)}

            {getDisabilityHistoryCount() > 2 && (
              <div className="text-purple-600 mt-1">他 {getDisabilityHistoryCount() - 2}件...</div>
            )}
          </div>
        </div>
      )}

      {/* フッター情報 */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>登録: {formatDate(resident.createdAt)}</span>
          <span>ID: {String(resident.id).slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
};

export default ResidentCard;
