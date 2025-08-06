import React, { useEffect, useState } from 'react'; // ? useState を追加！
import { ArrowRight, Building, Home, Calendar, Users, Edit, Trash2 } from 'lucide-react';
import { ExpansionRecord } from '../types/GroupHome';

interface ExpansionCardProps {
  expansion: ExpansionRecord;
  onEdit: (expansion: ExpansionRecord) => void;
  onDelete: (expansionId: string) => void;
}

const ExpansionCard: React.FC<ExpansionCardProps> = ({ expansion, onEdit, onDelete }) => {

  console.log("ExpansionCard内のexpansion", expansion);

  const getExpansionTypeDisplay = (type: 'A' | 'B') => {
    return type === 'A'
      ? { text: '別ユニット増床', color: 'bg-green-100 text-green-700', icon: '?' }
      : { text: '単純増床', color: 'bg-blue-100 text-blue-700', icon: '?' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ja-JP');
  };

  const typeInfo = getExpansionTypeDisplay(expansion.expansionType);

  function mapExpansionResponse(raw: any): ExpansionRecord {
    return {
      id: raw.id,
      propertyName: raw.property_name,
      unitName: raw.unit_name,
      startDate: raw.start_date,
      timestamp: raw.timestamp,
      expansionType: raw.expansion_type,
      newRooms: raw.new_rooms,
      commonRoom: raw.common_room,
    };
  }

  async function fetchExpansions() {
    const response = await fetch("/api/expansions");
    const data = await response.json();
    const expansions = data.map(mapExpansionResponse);
    return expansions;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{expansion.propertyName}</h3>
            <p className="text-sm text-gray-500">{expansion.unitName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${typeInfo.color}`}>
            {typeInfo.icon} {typeInfo.text}
          </span>
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(expansion)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-purple-50 text-purple-600 transition-colors"
              title="編集"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(expansion.id)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-colors"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">開始日</p>
            <p className="font-medium text-gray-800">{formatDate(expansion.startDate)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">新居室数</p>
            <p className="font-medium text-gray-800">{expansion.newRooms?.length ?? 0}室</p>
          </div>
        </div>
      </div>

      {/* 共用室情報（タイプAの場合のみ表示） */}
      {expansion.expansionType === 'A' && expansion.commonRoom && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Building className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">共用室</span>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            {expansion.commonRoom}
          </span>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">新しい居室</p>
        <div className="flex flex-wrap gap-2">
          {expansion.newRooms?.map((room, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
            >
              {room}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>登録日: {formatDate(expansion.timestamp)}</span>
          <span>ID: {String(expansion.id).slice(0, 8)}...</span>
        </div>
      </div>
    </div>
  );
};

export default ExpansionCard;
