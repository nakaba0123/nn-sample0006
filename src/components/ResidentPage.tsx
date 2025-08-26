import React, { useState } from 'react';
import { Users, Plus, Search, Filter, Home, Calendar, UserCheck, UserX } from 'lucide-react';
import { Resident } from '../types/Resident';
import { GroupHome, ExpansionRecord } from '../types/GroupHome';
import { useAuth } from '../hooks/useAuth';
import ResidentModal from './ResidentModal';
import ResidentCard from './ResidentCard';
import StatsCard from './StatsCard';
import PermissionGuard from './PermissionGuard';
import ResidentForm from './ResidentForm';

interface ResidentPageProps {
  residents: Resident[];
  groupHomes: GroupHome[];
  expansionRecords: ExpansionRecord[];
  onResidentSubmit: (data: Resident) => void;
  onEditResident: (resident: Resident) => void;
  onDeleteResident: (residentId: string) => void;
}

function camelizeKeys(obj: any) {
  console.log("obj::", obj);
  if (Array.isArray(obj)) {
    return obj.map(v => camelizeKeys(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(/_([a-z])/g, (_, char) => char.toUpperCase()),
        camelizeKeys(value),
      ])
    );
  }
  return obj;
}

const ResidentPage: React.FC<ResidentPageProps> = ({
  residents,
  groupHomes,
  expansionRecords,
  onResidentSubmit,
  onEditResident,
  onDeleteResident
}) => {
  const { currentUser, hasPermission } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupHomeFilter, setGroupHomeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [disabilityLevelFilter, setDisabilityLevelFilter] = useState('');

  // 在籍状況の自動判定
  const getAutoStatus = (resident: Resident): 'active' | 'inactive' => {
    if (!resident.moveOutDate) return 'active';
    const today = new Date();
    const moveOut = new Date(resident.moveOutDate);
    return moveOut <= today ? 'inactive' : 'active';
  };

  // フィルタリング
  const filteredResidents = residents.filter(resident => {
    const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resident.nameKana.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resident.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroupHome = !groupHomeFilter || resident.groupHomeId === groupHomeFilter;
    const matchesDisabilityLevel = !disabilityLevelFilter || resident.disabilityLevel === disabilityLevelFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = getAutoStatus(resident) === 'active';
    } else if (statusFilter === 'inactive') {
      matchesStatus = getAutoStatus(resident) === 'inactive';
    }
    
    return matchesSearch && matchesGroupHome && matchesStatus && matchesDisabilityLevel;
  });

  // 統計情報
  const activeResidents = residents.filter(r => getAutoStatus(r) === 'active').length;
  const inactiveResidents = residents.filter(r => getAutoStatus(r) === 'inactive').length;
  
  // 総部屋数を計算（初期登録分 + 増床分）
  const totalRooms = groupHomes.reduce((sum, gh) => sum + (gh.residentRooms?.length ?? 0), 0) +
                    expansionRecords.reduce((sum, exp) => sum + (exp.newRooms?.length ?? 0), 0);
  
  const occupancyRate = totalRooms > 0 ? Math.round((activeResidents / totalRooms) * 100) : 0;

  // 全ユニット（初期登録分 + 増床タイプA分）を取得してグループホーム選択肢を作成
  const getAllUnitsForFilter = () => {
    const units = new Map<string, { id: string; name: string }>();
    
    // 1. 初期登録されたグループホームのユニットを追加
    groupHomes.forEach(gh => {
      units.set(gh.id, {
        id: gh.id,
        name: `${gh.propertyName} - ${gh.unitName}`
      });
    });
    
    // 2. 増床タイプAで追加されたユニットを追加
    expansionRecords
      .filter(exp => exp.expansionType === 'A')
      .forEach(exp => {
        const key = `expansion_${exp.id}`;
        const name = `${exp.propertyName} - ${exp.unitName}`;
        // 既存のユニットと重複しない場合のみ追加
        const existingUnit = Array.from(units.values()).find(u => u.name === name);
        if (!existingUnit) {
          units.set(key, {
            id: key,
            name: name
          });
        }
      });
    
    return Array.from(units.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const groupHomeOptions = getAllUnitsForFilter();

  const handleAddResident = () => {
    setEditingResident(null);
    setIsModalOpen(true);
  };

  const handleEditResident = (resident: Resident) => {
    setEditingResident(resident);
    setIsModalOpen(true);
  };

  const handleDeleteResident = (residentId: string) => {
      onDeleteResident(residentId);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingResident(null);
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">ログインしてください</p>
        <p className="text-sm text-gray-400">
          利用者管理機能を利用するにはログインが必要です
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">利用者管理</h2>
          <p className="text-gray-600 mt-1">
            グループホーム利用者の登録・管理（全{residents.length}名）
          </p>
        </div>
        <PermissionGuard permissions={['user.create', 'user.edit']}>
          <button
            onClick={handleAddResident}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>利用者登録</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={<UserCheck className="w-6 h-6" />}
          title="入居中"
          value={activeResidents}
          subtitle="名"
          color="green"
        />
        <StatsCard
          icon={<UserX className="w-6 h-6" />}
          title="退居済み"
          value={inactiveResidents}
          subtitle="名"
          color="orange"
        />
        <StatsCard
          icon={<Home className="w-6 h-6" />}
          title="入居率"
          value={`${occupancyRate}%`}
          subtitle={`${activeResidents}/${totalRooms}室`}
          color="blue"
        />
        <StatsCard
          icon={<Users className="w-6 h-6" />}
          title="総利用者数"
          value={residents.length}
          subtitle="名"
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="名前、よみがな、部屋番号で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          
          <div className="relative">
            <Home className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={groupHomeFilter}
              onChange={(e) => setGroupHomeFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="">全グループホーム</option>
              {groupHomeOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="">全ステータス</option>
              <option value="active">入居中のみ</option>
              <option value="inactive">退居済みのみ</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={disabilityLevelFilter}
              onChange={(e) => setDisabilityLevelFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="">全障害支援区分</option>
              <option value="1以下">1以下</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </div>
        </div>
      </div>

      {/* Residents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">利用者一覧</h3>
          <p className="text-sm text-gray-600 mt-1">
            表示中: {filteredResidents.length}名
            {searchTerm && ` (「${searchTerm}」で検索中)`}
          </p>
        </div>
        
        <div className="p-6">
          {filteredResidents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchTerm || groupHomeFilter || statusFilter || disabilityLevelFilter
                  ? '検索条件に一致する利用者が見つかりません'
                  : 'まだ利用者が登録されていません'
                }
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm || groupHomeFilter || statusFilter || disabilityLevelFilter
                  ? '検索条件を変更してください'
                  : '「利用者登録」ボタンから利用者を追加してください'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredResidents.map((resident) => (
                <ResidentCard
                  key={resident.id}
                  resident={camelizeKeys(resident)}
                  onEdit={handleEditResident}
                  onDelete={handleDeleteResident}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
        <div className="flex items-start space-x-3">
          <Users className="w-6 h-6 text-emerald-600 mt-1" />
          <div>
            <h3 className="font-semibold text-emerald-800 mb-2">利用者管理について</h3>
            <div className="text-sm text-emerald-700 space-y-1">
              <p>• 利用者の基本情報、障害支援区分、入居先グループホームを管理できます</p>
              <p>• 入居日・退居日に基づいて在籍状況が自動判定されます</p>
              <p>• 部屋番号は選択したグループホームの利用可能な部屋から選択できます</p>
              <p>• 初期登録分と増床で追加されたユニット・部屋も選択対象に含まれます</p>
              <p>• 退居日が設定されている場合、その日付に基づいて自動的にステータスが更新されます</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <PermissionGuard permissions={['user.create', 'user.edit']}>
        <ResidentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={onResidentSubmit}
          editResident={editingResident}
          groupHomes={groupHomes}
          expansionRecords={expansionRecords}
        />
      </PermissionGuard>
    </div>
  );
};

export default ResidentPage;
