import React, { useState } from 'react';
import { Calendar, Users, Plus, Search, Filter, Clock, FileText } from 'lucide-react';
import { User } from '../types/User';
import { GroupHome } from '../types/GroupHome';
import { ShiftPreference } from '../types/ShiftPreference';
import { useAuth } from '../hooks/useAuth';
import ShiftPreferenceModal from './ShiftPreferenceModal';
import ShiftPreferenceCard from './ShiftPreferenceCard';
import StatsCard from './StatsCard';
import PermissionGuard from './PermissionGuard';

interface ShiftPreferencePageProps {
  users: User[];
  groupHomes: GroupHome[];
  shiftPreferences: ShiftPreference[];
  onShiftPreferenceSubmit: (data: ShiftPreference) => void;
  onEditShiftPreference: (preference: ShiftPreference) => void;
  onDeleteShiftPreference: (preferenceId: string) => void;
}

const ShiftPreferencePage: React.FC<ShiftPreferencePageProps> = ({
  users,
  groupHomes,
  shiftPreferences,
  onShiftPreferenceSubmit,
  onEditShiftPreference,
  onDeleteShiftPreference
}) => {
  const { currentUser, hasPermission } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreference, setEditingPreference] = useState<ShiftPreference | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedUser, setSelectedUser] = useState('');

  // 在職中の職員のみフィルタ
  const activeUsers = users.filter(user => {
    const autoStatus = user.retirementDate 
      ? new Date(user.retirementDate) <= new Date() ? 'inactive' : 'active'
      : 'active';
    return autoStatus === 'active';
  });

  // 表示対象のシフト希望を取得
  const getDisplayPreferences = () => {
    if (hasPermission('shift.preference.view.all')) {
      return shiftPreferences;
    } else if (hasPermission('shift.preference.own') && currentUser) {
      return shiftPreferences.filter(pref => pref.userId === currentUser.id);
    }
    return [];
  };

  // フィルタリング
  const filteredPreferences = getDisplayPreferences().filter(preference => {
    const matchesSearch = preference.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = preference.targetYear === selectedYear;
    const matchesMonth = preference.targetMonth === selectedMonth;
    const matchesUser = !selectedUser || preference.userId === selectedUser;
    
    return matchesSearch && matchesYear && matchesMonth && matchesUser;
  });

  // 統計情報
  const currentMonthPreferences = getDisplayPreferences().filter(
    p => p.targetYear === selectedYear && p.targetMonth === selectedMonth
  );
  
  const totalSubmissions = currentMonthPreferences.length;
  const totalActiveUsers = hasPermission('shift.preference.view.all') ? activeUsers.length : 1;
  const submissionRate = totalActiveUsers > 0 ? Math.round((totalSubmissions / totalActiveUsers) * 100) : 0;
  
  const totalDesiredDays = currentMonthPreferences.reduce((sum, pref) => 
    sum + pref.preferences.reduce((prefSum, ghPref) => prefSum + ghPref.desiredDays, 0), 0
  );

  const handleAddPreference = () => {
    setEditingPreference(null);
    setIsModalOpen(true);
  };

  const handleEditPreference = (preference: ShiftPreference) => {
    // 自分のシフト希望のみ編集可能（管理者は全て編集可能）
    if (hasPermission('shift.preference.view.all') || 
        (hasPermission('shift.preference.own') && currentUser && preference.userId === currentUser.id)) {
      setEditingPreference(preference);
      setIsModalOpen(true);
    }
  };

  const handleDeletePreference = (preferenceId: string) => {
    const preference = shiftPreferences.find(p => p.id === preferenceId);
    if (!preference) return;

    // 自分のシフト希望のみ削除可能（管理者は全て削除可能）
    if (hasPermission('shift.preference.view.all') || 
        (hasPermission('shift.preference.own') && currentUser && preference.userId === currentUser.id)) {
      onDeleteShiftPreference(preferenceId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPreference(null);
  };

  const getMonthName = (month: number) => {
    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return months[month - 1];
  };

  // 年月の選択肢を生成
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">ログインしてください</p>
        <p className="text-sm text-gray-400">
          シフト希望機能を利用するにはログインが必要です
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {hasPermission('shift.preference.view.all') ? 'シフト希望管理' : '自分のシフト希望'}
          </h2>
          <p className="text-gray-600 mt-1">
            {hasPermission('shift.preference.view.all') 
              ? '職員のグループホーム勤務希望を管理します'
              : 'グループホームへの勤務希望を登録・管理できます'
            }
          </p>
        </div>
        <PermissionGuard permissions={['shift.preference.own', 'shift.preference.view.all']}>
          <button
            onClick={handleAddPreference}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>シフト希望登録</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={<Calendar className="w-6 h-6" />}
          title={`${selectedYear}年${getMonthName(selectedMonth)}`}
          value={hasPermission('shift.preference.view.all') ? `${totalSubmissions}/${totalActiveUsers}` : totalSubmissions}
          subtitle={hasPermission('shift.preference.view.all') ? '提出状況' : '提出済み'}
          color="blue"
        />
        <PermissionGuard permission="shift.preference.view.all">
          <StatsCard
            icon={<Users className="w-6 h-6" />}
            title="提出率"
            value={`${submissionRate}%`}
            subtitle="在職職員中"
            color="green"
          />
        </PermissionGuard>
        <StatsCard
          icon={<Clock className="w-6 h-6" />}
          title="総希望日数"
          value={totalDesiredDays}
          subtitle="日"
          color="orange"
        />
        <StatsCard
          icon={<FileText className="w-6 h-6" />}
          title="対象施設数"
          value={groupHomes.length}
          subtitle="施設"
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <PermissionGuard permission="shift.preference.view.all">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="職員名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </PermissionGuard>
          
          <div className="relative">
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
            >
              {months.map(month => (
                <option key={month} value={month}>{getMonthName(month)}</option>
              ))}
            </select>
          </div>

          <PermissionGuard permission="shift.preference.view.all">
            <div className="relative">
              <Users className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="">全職員</option>
                {activeUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </PermissionGuard>

          <div className="flex items-center">
            <span className="text-sm text-gray-600">
              表示中: {filteredPreferences.length}件
            </span>
          </div>
        </div>
      </div>

      {/* 未提出職員の警告（管理者のみ） */}
      <PermissionGuard permission="shift.preference.view.all">
        {totalSubmissions < totalActiveUsers && (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">
                  {selectedYear}年{getMonthName(selectedMonth)}のシフト希望未提出者があります
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  {totalActiveUsers - totalSubmissions}名の職員がまだシフト希望を提出していません。
                </p>
                <div className="mt-2 text-sm text-amber-700">
                  未提出者: {activeUsers
                    .filter(user => !currentMonthPreferences.some(pref => pref.userId === user.id))
                    .map(user => user.name)
                    .join(', ')
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </PermissionGuard>

      {/* Shift Preferences List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {selectedYear}年{getMonthName(selectedMonth)}のシフト希望
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {hasPermission('shift.preference.view.all') 
              ? '職員の勤務希望を確認・編集できます'
              : '自分の勤務希望を確認・編集できます'
            }
          </p>
        </div>
        
        <div className="p-6">
          {filteredPreferences.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchTerm || selectedUser
                  ? '検索条件に一致するシフト希望が見つかりません'
                  : `${selectedYear}年${getMonthName(selectedMonth)}のシフト希望はまだ登録されていません`
                }
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm || selectedUser
                  ? '検索条件を変更してください'
                  : '「シフト希望登録」ボタンから希望を登録してください'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPreferences.map((preference) => (
                <ShiftPreferenceCard
                  key={preference.id}
                  preference={preference}
                  onEdit={handleEditPreference}
                  onDelete={handleDeletePreference}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-start space-x-3">
          <Calendar className="w-6 h-6 text-purple-600 mt-1" />
          <div>
            <h3 className="font-semibold text-purple-800 mb-2">シフト希望について</h3>
            <div className="text-sm text-purple-700 space-y-1">
              <p>• 職員は月ごとに各グループホームへの希望勤務日数を申告できます</p>
              <p>• 一人の職員が複数のグループホームに勤務希望を出すことができます</p>
              <p>• 希望休や特記事項は自由記述欄に記入してください</p>
              <p>• 登録後も編集・削除が可能です</p>
              {hasPermission('shift.preference.own') && !hasPermission('shift.preference.view.all') && (
                <p>• 自分のシフト希望のみ登録・編集できます</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <PermissionGuard permissions={['shift.preference.own', 'shift.preference.view.all']}>
        <ShiftPreferenceModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={onShiftPreferenceSubmit}
          editPreference={editingPreference}
          users={hasPermission('shift.preference.view.all') ? activeUsers : currentUser ? [currentUser] : []}
          groupHomes={groupHomes}
        />
      </PermissionGuard>
    </div>
  );
};

export default ShiftPreferencePage;