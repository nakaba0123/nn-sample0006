import React, { useState, useEffect } from 'react';
import { Search, Filter, Home, Plus, MapPin, ArrowRight } from 'lucide-react';
import { GroupHome, ExpansionRecord } from '../types/GroupHome';
import GroupHomeCard from './GroupHomeCard';
import ExpansionCard from './ExpansionCard';
import { mapExpansion } from '../util/mapExpansion'; // パスは適宜調整

interface GroupHomeListProps {
  groupHomes: GroupHome[];
  residents: Resident[];
  expansionRecords: ExpansionRecord[];
  onAddGroupHome: () => void;
  onAddExpansion: () => void;
  onEditGroupHome: (groupHome: GroupHome) => void;
  onDeleteGroupHome: (groupHomeId: string) => void;
  onEditExpansion: (expansion: ExpansionRecord) => void;
  onDeleteExpansion: (expansionId: string) => void;
}

const apiBaseUrl = 'https://nn-sample0006-production.up.railway.app';

const GroupHomeList: React.FC<GroupHomeListProps> = ({ 
  groupHomes, 
  residents,
  expansionRecords,
  onAddGroupHome, 
  onAddExpansion,
  onEditGroupHome, 
  onDeleteGroupHome,
  onEditExpansion,
  onDeleteExpansion
}) => {

  console.log(" groupHomes:", groupHomes);
  console.log(" expansionRecords", expansionRecords);

  groupHomes.forEach(gh => {
    expansionRecords.forEach(exp => {
      if (exp.propertyName?.trim().toLowerCase() === gh.propertyName?.trim().toLowerCase()) {
        console.log(`✅ MATCH: GH "${gh.propertyName}" == EX "${exp.propertyName}"`);
      } else {
        console.log(`❌ NO MATCH: GH "${gh.propertyName}" vs EX "${exp.propertyName}"`);
      }
    });
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [activeView, setActiveView] = useState<'facilities' | 'expansions'>('facilities');
  const [expansions, setExpansions] = useState<ExpansionRecord[]>([]);

  const filteredGroupHomes = groupHomes.filter(groupHome => {
    const matchesSearch =
      (groupHome.propertyName?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (groupHome.unitName?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      (groupHome.address?.toLowerCase() ?? "").includes(searchTerm.toLowerCase());
    
    const matchesAddress = !addressFilter || groupHome.address.includes(addressFilter);
    
    return matchesSearch && matchesAddress;
  });

  const filteredExpansions = expansionRecords.filter(expansion => {
    const propName = expansion.propertyName || "";
    const unitName = expansion.unitName || "";
    const search = searchTerm.toLowerCase();

    return (
      propName.toLowerCase().includes(search) ||
      unitName.toLowerCase().includes(search)
    );
  });

  const cities = [...new Set(groupHomes.map(gh => {
    const addressParts = gh.address.split(/[都道府県市区町村]/);
    return addressParts[0] + (addressParts[1] ? addressParts[1].split(/[市区町村]/)[0] : '');
  }))].filter(city => city);

  const totalRooms = groupHomes.reduce((sum, gh) => sum + (gh.residentRooms?.length ?? 0), 0);
  const totalExpansionRooms = expansionRecords.reduce((sum, exp) => sum + (exp.newRooms?.length ?? 0), 0);

  async function fetchExpansions() {
    const response = await fetch("/api/expansions");
    const data = await response.json();
    const expansions = data.map(mapExpansionResponse);
    return expansions;
  }

  // APIから来た snake_case を camelCase に変換する関数
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

  useEffect(() => {
    const loadExpansions = async () => {
      const fetched = await fetchExpansions();
      console.log("fetched expansions:", fetched);
      setExpansions(fetched); // キャメルケース版を state に保持
    };
    loadExpansions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">グループホーム管理</h2>
          <p className="text-gray-600 mt-1">
            全{groupHomes.length}施設（総居室数: {totalRooms + totalExpansionRooms}室）
            {totalExpansionRooms > 0 && <span className="text-purple-600"> • 増床: {totalExpansionRooms}室</span>}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onAddExpansion}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>既存GHへの増床登録</span>
          </button>
          <button
            onClick={onAddGroupHome}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>グループホーム登録</span>
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveView('facilities')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeView === 'facilities'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Home className="w-4 h-4 inline mr-2" />
          施設一覧 ({groupHomes.length})
        </button>
        <button
          onClick={() => setActiveView('expansions')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeView === 'expansions'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ArrowRight className="w-4 h-4 inline mr-2" />
          増床記録 ({Array.isArray(expansionRecords) ? expansionRecords.length : 0})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeView === 'facilities' ? "物件名、ユニット名、住所で検索..." : "物件名、ユニット名で検索..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
          
          {activeView === 'facilities' && (
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={addressFilter}
                onChange={(e) => setAddressFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="">全地域</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          {activeView === 'facilities' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {groupHomes.map((gh) => {
                console.log("グループホームGH", gh);
                console.log("ExpansionRecords",expansionRecords);
                console.log("グループホームGHのpropertyName", gh.propertyName);
                console.log("ExpansionRecords全体", expansionRecords);
                expansionRecords.forEach(exp => {
                  console.log("ExpansionRecord propertyName:", exp.propertyName);
                  console.log("ExpansionRecord property_name:", exp.property_name);
                });
                console.log("GH propertyName raw:", gh?.propertyName, JSON.stringify(gh?.propertyName));
                console.log("Expansion propertyName raw:", expansionRecords.propertyName, JSON.stringify(expansionRecords.propertyName));
                const matchedExpansions = expansionRecords.filter(
                  exp => exp.propertyName?.trim().toLowerCase() === gh.propertyName?.trim().toLowerCase()
                );
                console.log("matchedExpansions", matchedExpansions);
                console.log("gh.id::", gh.id);
                console.log("gh::", gh);

                return (
                  <GroupHomeCard
                    key={gh.id}
                    groupHome={gh}
                    expansions={matchedExpansions}
                    onEdit={onEditGroupHome}
                    onDelete={onDeleteGroupHome}
                    onEditExpansion={onEditExpansion}
                    onDeleteExpansion={onDeleteExpansion}
                  />
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {console.log("filteredExpansions::", filteredExpansions)}
              {filteredExpansions.map((expansion) => (
                <ExpansionCard
                  key={expansion.id}
                  expansion={expansion}
                  onEdit={onEditExpansion}
                  onDelete={onDeleteExpansion}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupHomeList;
