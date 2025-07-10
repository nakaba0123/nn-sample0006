import React, { useState } from 'react';
import { Settings, Building, Shield, Plus, Search, Database, Users, Lock } from 'lucide-react';
import { Department } from '../types/Department';
import { Role } from '../types/Role';
import { useAuth } from '../hooks/useAuth';
import DepartmentMasterSection from './DepartmentMasterSection';
import RoleMasterSection from './RoleMasterSection';
import StatsCard from './StatsCard';

interface MasterDataPageProps {
  departments: Department[];
  roles: Role[];
  onAddDepartment: () => void;
  onEditDepartment: (department: Department) => void;
  onDeleteDepartment: (departmentId: string) => void;
  onAddRole: () => void;
  onEditRole: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
}

const MasterDataPage: React.FC<MasterDataPageProps> = ({
  departments,
  roles,
  onAddDepartment,
  onEditDepartment,
  onDeleteDepartment,
  onAddRole,
  onEditRole,
  onDeleteRole
}) => {
  const { currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState<'departments' | 'roles'>('departments');
  const [searchTerm, setSearchTerm] = useState('');

  const sections = [
    {
      id: 'departments' as const,
      name: '部署マスタ',
      icon: <Building className="w-5 h-5" />,
      description: '職員登録で使用する部署の管理',
      count: departments.length,
      color: 'blue'
    },
    {
      id: 'roles' as const,
      name: 'ロールマスタ',
      icon: <Shield className="w-5 h-5" />,
      description: 'アクセス権限の管理',
      count: roles.length,
      color: 'purple'
    }
  ];

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">ログインしてください</p>
        <p className="text-sm text-gray-400">
          マスタ管理機能を利用するにはログインが必要です
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">各種マスタ管理</h2>
          <p className="text-gray-600 mt-1">
            システムで使用するマスタデータの一括管理
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={<Building className="w-6 h-6" />}
          title="部署マスタ"
          value={departments.length}
          subtitle="登録済み"
          color="blue"
        />
        <StatsCard
          icon={<Shield className="w-6 h-6" />}
          title="ロールマスタ"
          value={roles.length}
          subtitle="登録済み"
          color="purple"
        />
        <StatsCard
          icon={<Database className="w-6 h-6" />}
          title="総マスタ数"
          value={departments.length + roles.length}
          subtitle="項目"
          color="green"
        />
        <StatsCard
          icon={<Users className="w-6 h-6" />}
          title="管理対象"
          value="2"
          subtitle="マスタ種別"
          color="orange"
        />
      </div>

      {/* Section Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-1 mb-6">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeSection === section.id
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {section.icon}
              <div className="text-left">
                <div className="text-sm font-medium">{section.name}</div>
                <div className="text-xs opacity-75">{section.count}件</div>
              </div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`${sections.find(s => s.id === activeSection)?.name}を検索...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Active Section Content */}
        <div className="min-h-[400px]">
          {activeSection === 'departments' && (
            <DepartmentMasterSection
              departments={departments}
              searchTerm={searchTerm}
              onAdd={onAddDepartment}
              onEdit={onEditDepartment}
              onDelete={onDeleteDepartment}
            />
          )}
          
          {activeSection === 'roles' && (
            <RoleMasterSection
              roles={roles}
              searchTerm={searchTerm}
              onAdd={onAddRole}
              onEdit={onEditRole}
              onDelete={onDeleteRole}
            />
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-start space-x-3">
          <Database className="w-6 h-6 text-indigo-600 mt-1" />
          <div>
            <h3 className="font-semibold text-indigo-800 mb-2">マスタ管理について</h3>
            <div className="text-sm text-indigo-700 space-y-1">
              <p>• <strong>部署マスタ</strong>: 職員登録時の部署選択肢として使用されます</p>
              <p>• <strong>ロールマスタ</strong>: 職員のアクセス権限を制御するために使用されます</p>
              <p>• マスタデータを削除する前に、関連する職員データがないか確認してください</p>
              <p>• 将来的にシフト種別、勤務形態などのマスタもここで管理予定です</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterDataPage;