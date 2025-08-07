import { useEffect, useState } from "react";
import axios from 'axios';
import React from 'react';
import { Home, MapPin, Phone, Calendar, Users, Edit, Trash2, Building, ArrowRight } from 'lucide-react';
import { GroupHome, ExpansionRecord } from '../types/GroupHome';
import { mapGroupHome } from "../util/mapGroupHome"; // パスは適宜！1
import { mapExpansionResponse } from "../util/mapExpansion"; // これも忘れず！

interface GroupHomeCardProps {
  groupHome: GroupHome;
  expansions: ExpansionRecord[];
  onEdit: (groupHome: GroupHome) => void;
  onDelete: (groupHomeId: string) => void;
  onEditExpansion: (expansion: ExpansionRecord) => void;
  onDeleteExpansion: (expansionId: string) => void;
}

type Expansion = {
  id: number;
  groupHomeId: number;
  propertyName: string;
  unitName: string;
  expansionType: string;
  newRooms: string[];
  commonRoom: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

type Props = {
  groupHome: {
    propertyName: string;
    unitName: string;
    postalCode: string;
    address: string;
    phoneNumber: string;
    commonRoom: string;
    residentRooms: any[];
    openingDate: string;
    createdAt: string;
  };
  expansions?: Expansion[];
  onEdit?: () => void;
  onDelete?: () => void;
  onEditExpansion?: () => void;
  onDeleteExpansion?: () => void;
};

const toCamel = (s: string) =>
  s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const convertExpansionToCamelCase = (expansions: any): any[] => {
  if (!Array.isArray(expansions)) return [];
  return expansions.map((expansion) => ({
    ...expansion,
    expansionId: expansion.expansion_id,
    groupHomeId: expansion.group_home_id,
    addedRooms: expansion.added_rooms,
    expansionDate: expansion.expansion_date,
    createdAt: expansion.created_at,
  }));
};

const GroupHomeCard: React.FC<GroupHomeCardProps> = ({ 
  groupHome, 
  expansions,
  onEdit, 
  onDelete,
  onEditExpansion,
  onDeleteExpansion
}) => {
  console.log('🪵 受け取った groupHome:', groupHome);
  console.log("🐛 expansions の typeof:", typeof expansions);
  console.log('🪵 受け取った expansions:', expansions);
  const camelExpansions = Array.isArray(expansions)
    ? expansions?.map(convertExpansionToCamelCase)
    : [];
  console.log('🪵 受け取った camelExpansions:', camelExpansions);


  const [groupHomes, setGroupHomes] = useState([]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatPhoneNumber = (phone: string) => {
    return (phone ?? '').replace(/(\d{2,3})(\d{4})(\d{4})/, '$1-$2-$3');
  };

  const getExpansionTypeDisplay = (type: 'A' | 'B') => {
    return type === 'A' 
      ? { text: '別ユニット増床', color: 'text-green-600', icon: '🏢' }
      : { text: '単純増床', color: 'text-blue-600', icon: '📈' };
  };

  // この物件に関連する増床記録を取得
  const relatedExpansions = camelExpansions.filter(
    exp => exp.propertyName?.trim() === groupHome.propertyName?.trim()
  );
  const totalExpansionRooms = relatedExpansions.reduce((sum, exp) => sum + (exp.newRooms?.length ?? 0), 0);
  console.log("?　relatedExpansions:", relatedExpansions);
  console.log("?? groupHome.propertyName:", groupHome.propertyName);
//  camelExpansions.forEach((exp, i) => {
//    console.log(`?? camelExpansions[${i}].propertyName:`, exp.propertyName);
//  });


const fetchExpansions = async () => {
  const res = await axios.get("/api/expansions");
  const mapped = res.data.map(mapExpansionResponse);
  setExpansions(mapped);
};


useEffect(() => {
  axios.get("/api/group-homes").then((res) => {
    const mapped = res.data.map((gh) => mapGroupHome(gh));
    setGroupHomes(mapped);
  });
}, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      {/* メイン施設情報 */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">{groupHome.propertyName}</h3>
              <p className="text-sm text-gray-500">{groupHome.unitName}</p>
            </div>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(groupHome)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-orange-50 text-orange-600 transition-colors"
              title="編集"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(groupHome.id)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-colors"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">〒{groupHome.postalCode}</span>
          </div>
          <div className="flex items-start space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <span className="text-gray-600">{groupHome.address}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">{formatPhoneNumber(groupHome.phoneNumber)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">開所: {formatDate(groupHome.openingDate)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Building className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">共用室</span>
            </div>
            <p className="text-orange-700 font-semibold">{groupHome.commonRoom}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">総居室数</span>
            </div>
            <p className="text-blue-700 font-semibold">
              {groupHome.residentRooms?.length + totalExpansionRooms}室
              {totalExpansionRooms > 0 && (
                <span className="text-xs text-blue-600 ml-1">
                  (基本{groupHome.residentRooms?.length} + 増床{totalExpansionRooms})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">基本居室</span>
            <span className="text-xs text-gray-500">{groupHome.residentRooms?.length}室</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {groupHome.residentRooms?.slice(0, 6).map((room, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {room}
              </span>
            ))}
            {groupHome.residentRooms?.length > 6 && (
              <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                +{groupHome.residentRooms?.length - 6}室
              </span>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>登録日: {formatDate(groupHome.createdAt)}</span>
            <span>ID: {String(groupHome.id).slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* 増床情報（階層表示） */}
      {relatedExpansions.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <ArrowRight className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">増床記録 ({relatedExpansions.length}件)</span>
            </div>
            
            <div className="space-y-3">
              {relatedExpansions.map((expansion) => {
                const typeInfo = getExpansionTypeDisplay(expansion.expansionType);
                return (
                  <div key={expansion.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <ArrowRight className="w-3 h-3 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{expansion.unitName}</p>
                          <p className={`text-xs ${typeInfo.color}`}>
                            {typeInfo.icon} {typeInfo.text}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => onEditExpansion(expansion)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-purple-50 text-purple-600 transition-colors"
                          title="増床情報編集"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDeleteExpansion(expansion.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-red-600 transition-colors"
                          title="増床記録削除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-xs">
                        <span className="text-gray-500">開始日:</span>
                        <span className="text-gray-800 ml-1">{formatDate(expansion.startDate)}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">居室数:</span>
                        <span className="text-gray-800 ml-1">{expansion.newRooms?.length ?? 0}室</span>
                      </div>
                    </div>

                    {/* 共用室情報（タイプAの場合のみ表示） */}
                    {expansion.expansionType === 'A' && expansion.commonRoom && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">共用室:</p>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          {expansion.commonRoom}
                        </span>
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-gray-500 mb-1">増床居室:</p>
                      <div className="flex flex-wrap gap-1">
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupHomeCard;
