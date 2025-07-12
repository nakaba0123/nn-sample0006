import axios from "axios";
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import AttendancePage from './components/AttendancePage';
import UserList from './components/UserList';
import UserModal from './components/UserModal';
import GroupHomeList from './components/GroupHomeList';
import GroupHomeModal from './components/GroupHomeModal';
import ExpansionModal from './components/ExpansionModal';
import DepartmentList from './components/DepartmentList';
import DepartmentModal from './components/DepartmentModal';
import ShiftPreferencePage from './components/ShiftPreferencePage';
import MasterDataPage from './components/MasterDataPage';
import RoleModal from './components/RoleModal';
import ResidentPage from './components/ResidentPage';
import UsageRecordPage from './components/UsageRecordPage';
import UserSelector from './components/UserSelector';
import AuthProvider from './components/AuthProvider';
import PermissionGuard from './components/PermissionGuard';
import { User, UserFormData } from './types/User';
import { GroupHome, GroupHomeFormData, ExpansionRecord, ExpansionFormData } from './types/GroupHome';
import { Department, DepartmentFormData } from './types/Department';
import { Role, RoleFormData, DEFAULT_ROLES } from './types/Role';
import { ShiftPreference } from './types/ShiftPreference';
import { Resident } from './types/Resident';
import { UsageRecord } from './types/UsageRecord';

interface AttendanceData {
  name: string;
  checkIn: string;
  checkOut: string;
  shiftType: string;
  timestamp: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'users' | 'grouphomes' | 'departments' | 'shifts' | 'masters' | 'residents' | 'usage'>('attendance');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceData[]>([]);
  const [users, setUsers] = useState<User[]>([
    // デモ用の初期ユーザー（管理者）
    {
      id: 'user_admin_001',
      name: '管理者 太郎',
      email: 'admin@company.com',
      department: '総務部',
      position: 'システム管理者',
      employeeId: 'ADM001',
      joinDate: '2020-01-01',
      status: 'active',
      role: 'admin',
      createdAt: new Date().toISOString(),
      departmentHistory: [
        {
          id: 'hist_admin_001',
          departmentName: '総務部',
          startDate: '2020-01-01',
          createdAt: new Date().toISOString()
        }
      ]
    },
    // デモ用の一般職員
    {
      id: 'user_staff_001',
      name: '職員 花子',
      email: 'staff@company.com',
      department: '営業部',
      position: '一般職員',
      employeeId: 'STF001',
      joinDate: '2022-04-01',
      status: 'active',
      role: 'staff',
      createdAt: new Date().toISOString(),
      departmentHistory: [
        {
          id: 'hist_staff_001',
          departmentName: '営業部',
          startDate: '2022-04-01',
          createdAt: new Date().toISOString()
        }
      ]
    },
    // デモ用の給与担当者
    {
      id: 'user_payroll_001',
      name: '給与 次郎',
      email: 'payroll@company.com',
      department: '人事部',
      position: '給与担当',
      employeeId: 'PAY001',
      joinDate: '2021-01-01',
      status: 'active',
      role: 'payroll',
      createdAt: new Date().toISOString(),
      departmentHistory: [
        {
          id: 'hist_payroll_001',
          departmentName: '人事部',
          startDate: '2021-01-01',
          createdAt: new Date().toISOString()
        }
      ]
    }
  ]);
  const [groupHomes, setGroupHomes] = useState<GroupHome[]>([]);
  const [expansionRecords, setExpansionRecords] = useState<ExpansionRecord[]>([]);
  const [shiftPreferences, setShiftPreferences] = useState<ShiftPreference[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: 'dept_001',
      name: '営業部',
      createdAt: new Date().toISOString()
    },
    {
      id: 'dept_002',
      name: '開発部',
      createdAt: new Date().toISOString()
    },
    {
      id: 'dept_003',
      name: 'マーケティング部',
      createdAt: new Date().toISOString()
    },
    {
      id: 'dept_004',
      name: '人事部',
      createdAt: new Date().toISOString()
    },
    {
      id: 'dept_005',
      name: '経理部',
      createdAt: new Date().toISOString()
    },
    {
      id: 'dept_006',
      name: '総務部',
      createdAt: new Date().toISOString()
    }
  ]);
  
  // ロール管理の状態を追加
  const [roles, setRoles] = useState<Role[]>(() => {
    return DEFAULT_ROLES.map((role, index) => ({
      ...role,
      id: `role_${index + 1}`,
      createdAt: new Date().toISOString()
    }));
  });
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isGroupHomeModalOpen, setIsGroupHomeModalOpen] = useState(false);
  const [isExpansionModalOpen, setIsExpansionModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingGroupHome, setEditingGroupHome] = useState<GroupHome | null>(null);
  const [editingExpansion, setEditingExpansion] = useState<ExpansionRecord | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleAttendanceSubmit = (data: AttendanceData) => {
    const newRecord = {
      ...data,
      timestamp: new Date().toISOString()
    };
    setAttendanceRecords(prev => [newRecord, ...prev]);
  };

  const handleUserSubmit = (data: UserFormData & { departmentHistory?: any[] }) => {
    if (editingUser) {
      // Edit existing user
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id 
          ? { 
              ...user, 
              ...data,
              // 現在の部署を履歴から更新
              department: data.departmentHistory?.find(h => !h.endDate)?.departmentName || user.department,
              departmentHistory: data.departmentHistory || user.departmentHistory
            }
          : user
      ));
      setEditingUser(null);
    } else {
      // Add new user
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        email: data.email,
        department: data.department,
        position: data.position,
        employeeId: data.employeeId,
        joinDate: data.joinDate,
        retirementDate: data.retirementDate,
        status: data.status,
        role: data.role,
        createdAt: new Date().toISOString(),
        departmentHistory: data.departmentHistory || []
      };
      setUsers(prev => [newUser, ...prev]);
    }
  };

const handleGroupHomeSubmit = async (formData: GroupHomeFormData) => {
  try {
    const response = await axios.post("https://nn-sample0006-production.up.railway.app/group-homes", {
      property_name: formData.propertyName,
      unit_name: formData.unitName,
      postal_code: formData.postalCode,
      address: formData.address,
      phone_number: formData.phoneNumber,
      common_room: formData.commonRoom,
      resident_rooms: formData.residentRooms,
      opening_date: formData.openingDate,
    });

    console.log("登録成功:", response.data);

    // ✅ INSERT成功後に一覧再取得
    await fetchGroupHomes();
  } catch (error) {
    console.error("登録エラー:", error);
  }
};

const fetchGroupHomes = async () => {
  try {
    const res = await axios.get(
      "https://nn-sample0006-production.up.railway.app/group-homes"
    );
    const data = res.data.map((gh: any) => ({
      id: gh.id,
      propertyName: gh.property_name,
      unitName: gh.unit_name,
      postalCode: gh.postal_code,
      address: gh.address,
      phoneNumber: gh.phone_number,
      commonRoom: gh.common_room,
      // ここ！ 文字列 → 配列に変換
      residentRooms: Array.isArray(gh.resident_rooms)
        ? gh.resident_rooms
        : JSON.parse(gh.resident_rooms || "[]"),
      openingDate: gh.opening_date,
      createdAt: gh.created_at,
    }));
    setGroupHomes(data);
  } catch (err) {
    console.error("一覧取得エラー:", err);
  }
};

// 1️⃣ 最初のマウント時に一覧取得
useEffect(() => {
  const fetchData = async () => {
    await fetchGroupHomes();
  };
  fetchData();
}, []);

  const handleExpansionSubmit = (data: ExpansionFormData) => {
    if (editingExpansion) {
      // Edit existing expansion
      setExpansionRecords(prev => prev.map(expansion => 
        expansion.id === editingExpansion.id 
          ? { ...expansion, ...data }
          : expansion
      ));
      setEditingExpansion(null);
    } else {
      // Add new expansion
      const newExpansion: ExpansionRecord = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        timestamp: new Date().toISOString()
      };
      setExpansionRecords(prev => [newExpansion, ...prev]);
    }
  };

  const handleDepartmentSubmit = (data: DepartmentFormData) => {
    if (editingDepartment) {
      // Edit existing department
      const oldDepartmentName = editingDepartment.name;
      const newDepartmentName = data.name;
      
      // Update department
      setDepartments(prev => prev.map(department => 
        department.id === editingDepartment.id 
          ? { ...department, ...data }
          : department
      ));
      
      // Update users' department history if department name changed
      if (oldDepartmentName !== newDepartmentName) {
        setUsers(prev => prev.map(user => ({
          ...user,
          department: user.department === oldDepartmentName ? newDepartmentName : user.department,
          departmentHistory: user.departmentHistory?.map(history => ({
            ...history,
            departmentName: history.departmentName === oldDepartmentName ? newDepartmentName : history.departmentName
          })) || []
        })));
      }
      
      setEditingDepartment(null);
    } else {
      // Add new department
      const newDepartment: Department = {
        id: `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date().toISOString()
      };
      setDepartments(prev => [newDepartment, ...prev]);
    }
  };

  const handleRoleSubmit = (data: RoleFormData) => {
    if (editingRole) {
      // Edit existing role
      const updatedRole: Role = {
        ...editingRole,
        ...data,
        permissions: data.permissions.map(permName => {
          // 既存の権限から検索、なければデフォルトから検索
          const existingPermission = editingRole.permissions.find(p => p.name === permName);
          if (existingPermission) return existingPermission;
          
          // デフォルトロールから権限を検索
          for (const defaultRole of DEFAULT_ROLES) {
            const permission = defaultRole.permissions.find(p => p.name === permName);
            if (permission) return permission;
          }
          
          // 見つからない場合はダミーの権限を作成
          return {
            id: `perm_${permName}`,
            name: permName,
            displayName: permName,
            category: 'その他',
            description: permName
          };
        })
      };
      
      setRoles(prev => prev.map(role => 
        role.id === editingRole.id ? updatedRole : role
      ));
      setEditingRole(null);
    } else {
      // Add new role
      const newRole: Role = {
        id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        permissions: data.permissions.map(permName => {
          // デフォルトロールから権限を検索
          for (const defaultRole of DEFAULT_ROLES) {
            const permission = defaultRole.permissions.find(p => p.name === permName);
            if (permission) return permission;
          }
          
          // 見つからない場合はダミーの権限を作成
          return {
            id: `perm_${permName}`,
            name: permName,
            displayName: permName,
            category: 'その他',
            description: permName
          };
        }),
        createdAt: new Date().toISOString()
      };
      setRoles(prev => [newRole, ...prev]);
    }
  };

  const handleShiftPreferenceSubmit = (data: ShiftPreference) => {
    const existingIndex = shiftPreferences.findIndex(
      pref => pref.userId === data.userId && 
              pref.targetYear === data.targetYear && 
              pref.targetMonth === data.targetMonth
    );

    if (existingIndex >= 0) {
      // Update existing preference
      setShiftPreferences(prev => prev.map((pref, index) => 
        index === existingIndex ? data : pref
      ));
    } else {
      // Add new preference
      setShiftPreferences(prev => [data, ...prev]);
    }
  };

  const handleResidentSubmit = (data: Resident) => {
    if (residents.find(r => r.id === data.id)) {
      // Edit existing resident
      setResidents(prev => prev.map(resident => 
        resident.id === data.id ? data : resident
      ));
    } else {
      // Add new resident
      setResidents(prev => [data, ...prev]);
    }
  };

  const handleUsageRecordUpdate = (records: UsageRecord[]) => {
    setUsageRecords(records);
  };

  const handleEditShiftPreference = (preference: ShiftPreference) => {
    // This will be handled by the ShiftPreferencePage component
  };

  const handleDeleteShiftPreference = (preferenceId: string) => {
    if (window.confirm('このシフト希望を削除してもよろしいですか？')) {
      setShiftPreferences(prev => prev.filter(pref => pref.id !== preferenceId));
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('この職員を削除してもよろしいですか？')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
      // 関連するシフト希望も削除
      setShiftPreferences(prev => prev.filter(pref => pref.userId !== userId));
    }
  };

  const handleEditGroupHome = (groupHome: GroupHome) => {
    setEditingGroupHome(groupHome);
    setIsGroupHomeModalOpen(true);
  };

  const handleDeleteGroupHome = (groupHomeId: string) => {
    if (window.confirm('このグループホームを削除してもよろしいですか？')) {
      setGroupHomes(prev => prev.filter(gh => gh.id !== groupHomeId));
      // 関連するシフト希望も更新
      setShiftPreferences(prev => prev.map(pref => ({
        ...pref,
        preferences: pref.preferences.filter(ghPref => ghPref.groupHomeId !== groupHomeId)
      })).filter(pref => pref.preferences.length > 0));
      // 関連する利用者も削除
      setResidents(prev => prev.filter(resident => resident.groupHomeId !== groupHomeId));
    }
  };

  const handleEditExpansion = (expansion: ExpansionRecord) => {
    setEditingExpansion(expansion);
    setIsExpansionModalOpen(true);
  };

  const handleDeleteExpansion = (expansionId: string) => {
    if (window.confirm('この増床記録を削除してもよろしいですか？')) {
      setExpansionRecords(prev => prev.filter(exp => exp.id !== expansionId));
    }
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setIsDepartmentModalOpen(true);
  };

  const handleDeleteDepartment = (departmentId: string) => {
    // Check if any users are assigned to this department
    const departmentName = departments.find(d => d.id === departmentId)?.name;
    const usersInDepartment = users.filter(user => 
      user.department === departmentName || 
      user.departmentHistory?.some(h => h.departmentName === departmentName)
    );
    
    if (usersInDepartment.length > 0) {
      alert(`この部署には${usersInDepartment.length}名の職員が関連しているため削除できません。\n先に職員の部署履歴を変更してください。`);
      return;
    }

    if (window.confirm('この部署を削除してもよろしいですか？')) {
      setDepartments(prev => prev.filter(dept => dept.id !== departmentId));
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    // システムロールは削除不可
    if (['admin', 'staff', 'payroll'].includes(role.name)) {
      alert('システムロールは削除できません。');
      return;
    }

    // このロールを使用している職員がいるかチェック
    const usersWithRole = users.filter(user => user.role === role.name);
    if (usersWithRole.length > 0) {
      alert(`このロールは${usersWithRole.length}名の職員に割り当てられているため削除できません。\n先に職員のロールを変更してください。`);
      return;
    }

    if (window.confirm('このロールを削除してもよろしいですか？')) {
      setRoles(prev => prev.filter(r => r.id !== roleId));
    }
  };

  const handleEditResident = (resident: Resident) => {
    handleResidentSubmit(resident);
  };

  const handleDeleteResident = (residentId: string) => {
    if (window.confirm('この利用者を削除してもよろしいですか？')) {
      setResidents(prev => prev.filter(resident => resident.id !== residentId));
      // 関連する利用実績記録も削除
      setUsageRecords(prev => prev.filter(record => record.residentId !== residentId));
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleAddGroupHome = () => {
    setEditingGroupHome(null);
    setIsGroupHomeModalOpen(true);
  };

  const handleAddExpansion = () => {
    setEditingExpansion(null);
    setIsExpansionModalOpen(true);
  };

  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setIsDepartmentModalOpen(true);
  };

  const handleAddRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleCloseGroupHomeModal = () => {
    setIsGroupHomeModalOpen(false);
    setEditingGroupHome(null);
  };

  const handleCloseExpansionModal = () => {
    setIsExpansionModalOpen(false);
    setEditingExpansion(null);
  };

  const handleCloseDepartmentModal = () => {
    setIsDepartmentModalOpen(false);
    setEditingDepartment(null);
  };

  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false);
    setEditingRole(null);
  };

  // 利用可能な権限を取得（全デフォルトロールから）
  const getAllAvailablePermissions = () => {
    const allPermissions = new Map();
    DEFAULT_ROLES.forEach(role => {
      role.permissions.forEach(permission => {
        allPermissions.set(permission.name, permission);
      });
    });
    return Array.from(allPermissions.values());
  };

  return (
    <AuthProvider users={users}>
      <div className="min-h-screen bg-gray-50">
        {/* Header with User Selector */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end h-12">
              <UserSelector users={users} />
            </div>
          </div>
        </div>

        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'attendance' && (
            <AttendancePage
              attendanceRecords={attendanceRecords}
              onAttendanceSubmit={handleAttendanceSubmit}
            />
          )}
          
          {activeTab === 'users' && (
            <PermissionGuard permissions={['user.view.all', 'user.create', 'user.edit']}>
              <UserList
                users={users}
                onAddUser={handleAddUser}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
              />
            </PermissionGuard>
          )}

          {activeTab === 'residents' && (
            <PermissionGuard permissions={['user.view.all', 'user.create', 'user.edit']}>
              <ResidentPage
                residents={residents}
                groupHomes={groupHomes}
                expansionRecords={expansionRecords}
                onResidentSubmit={handleResidentSubmit}
                onEditResident={handleEditResident}
                onDeleteResident={handleDeleteResident}
              />
            </PermissionGuard>
          )}

          {activeTab === 'usage' && (
            <PermissionGuard permissions={['user.view.all', 'user.create', 'user.edit']}>
              <UsageRecordPage
                residents={residents}
                groupHomes={groupHomes}
                expansionRecords={expansionRecords}
                usageRecords={usageRecords}
                onUsageRecordUpdate={handleUsageRecordUpdate}
              />
            </PermissionGuard>
          )}
          
          {activeTab === 'grouphomes' && (
            <PermissionGuard permissions={['grouphome.create', 'grouphome.edit', 'grouphome.delete']}>
              <GroupHomeList
                groupHomes={groupHomes}
                expansionRecords={expansionRecords}
                onAddGroupHome={handleAddGroupHome}
                onAddExpansion={handleAddExpansion}
                onEditGroupHome={handleEditGroupHome}
                onDeleteGroupHome={handleDeleteGroupHome}
                onEditExpansion={handleEditExpansion}
                onDeleteExpansion={handleDeleteExpansion}
              />
            </PermissionGuard>
          )}

          {activeTab === 'departments' && (
            <PermissionGuard permission="department.manage">
              <DepartmentList
                departments={departments}
                onAddDepartment={handleAddDepartment}
                onEditDepartment={handleEditDepartment}
                onDeleteDepartment={handleDeleteDepartment}
              />
            </PermissionGuard>
          )}

          {activeTab === 'masters' && (
            <PermissionGuard permissions={['system.settings', 'department.manage']}>
              <MasterDataPage
                departments={departments}
                roles={roles}
                onAddDepartment={handleAddDepartment}
                onEditDepartment={handleEditDepartment}
                onDeleteDepartment={handleDeleteDepartment}
                onAddRole={handleAddRole}
                onEditRole={handleEditRole}
                onDeleteRole={handleDeleteRole}
              />
            </PermissionGuard>
          )}

          {activeTab === 'shifts' && (
            <ShiftPreferencePage
              users={users}
              groupHomes={groupHomes}
              shiftPreferences={shiftPreferences}
              onShiftPreferenceSubmit={handleShiftPreferenceSubmit}
              onEditShiftPreference={handleEditShiftPreference}
              onDeleteShiftPreference={handleDeleteShiftPreference}
            />
          )}
        </main>

        <PermissionGuard permissions={['user.create', 'user.edit']}>
          <UserModal
            isOpen={isUserModalOpen}
            onClose={handleCloseUserModal}
            onSubmit={handleUserSubmit}
            editUser={editingUser}
            departments={departments}
          />
        </PermissionGuard>

        <PermissionGuard permissions={['grouphome.create', 'grouphome.edit']}>
          <GroupHomeModal
            isOpen={isGroupHomeModalOpen}
            onClose={handleCloseGroupHomeModal}
            onSubmit={handleGroupHomeSubmit}
            editGroupHome={editingGroupHome}
          />
        </PermissionGuard>

        <PermissionGuard permissions={['grouphome.create', 'grouphome.edit']}>
          <ExpansionModal
            isOpen={isExpansionModalOpen}
            onClose={handleCloseExpansionModal}
            onSubmit={handleExpansionSubmit}
            groupHomes={groupHomes}
            expansionRecords={expansionRecords}
            editExpansion={editingExpansion}
          />
        </PermissionGuard>

        <PermissionGuard permission="department.manage">
          <DepartmentModal
            isOpen={isDepartmentModalOpen}
            onClose={handleCloseDepartmentModal}
            onSubmit={handleDepartmentSubmit}
            editDepartment={editingDepartment}
          />
        </PermissionGuard>

        <PermissionGuard permission="system.settings">
          <RoleModal
            isOpen={isRoleModalOpen}
            onClose={handleCloseRoleModal}
            onSubmit={handleRoleSubmit}
            editRole={editingRole}
            availablePermissions={getAllAvailablePermissions()}
          />
        </PermissionGuard>
      </div>
    </AuthProvider>
  );
}

export default App;
