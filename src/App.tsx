import axios from "axios";
import React, { useState, useEffect } from 'react';
import { useCallback } from "react";  // ← これを追加
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
import ResidentModal from './components/ResidentModal';  // ← 追加
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
import { mapGroupHome } from "./util/mapGroupHome"; // パスは適宜！1
import { mapExpansion } from "./util/mapExpansion"; // パスは適宜！1
import { mapResident } from "./util/mapResident"; // パスは適宜！1
import { mapUser } from "./util/mapUser"; // パスは適宜！1
import { mapDepartmentHistory } from "./util/mapUser"; // パスは適宜！1

interface AttendanceData {
  name: string;
  checkIn: string;
  checkOut: string;
  shiftType: string;
  timestamp: string;
}

const API_BASE_URL = 'https://nn-sample0006-production.up.railway.app/api';

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

const ensureArray = (v: any) => {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.rows)) return v.rows;
  return [];
};

// state（既に users state があれば rawUsers を追加するだけ）
const [rawUsers, setRawUsers] = useState<any[]>([]); // 生のAPIレスポンス（snake_case）
const [departmentHistoriesRaw, setDepartmentHistoriesRaw] = useState<any[]>([]); // もし既にあれば使う


  const [groupHomesMain, setGroupHomesMain] = useState<GroupHome[]>([]);
  const [groupHomesSub, setGroupHomesSub] = useState<GroupHome[]>([]);
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
  const [editingResident, setEditingResident] = useState<Resident | null>(null); // ← 追加
  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);  // ← 追加
  const [rawResidents, setRawResidents] = useState([]);
  const [disabilityHistories, setDisabilityHistories] = useState([]);
  const [departmentHistories, setDepartmentHistories] = useState([]);

//  console.log("👀 モーダル状態:", isResidentModalOpen);

  const handleAttendanceSubmit = (data: AttendanceData) => {
    const newRecord = {
      ...data,
      timestamp: new Date().toISOString()
    };
    setAttendanceRecords(prev => [newRecord, ...prev]);
  };

/*
const handleUserSubmit = async (data: UserFormData & { departmentHistory?: any[] }) => {
  try {
    if (editingUser) {
      // 既存ユーザー更新
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Update failed");
      const updatedUserRaw = await response.json();
      const updatedUser = {
        ...mapUser(updatedUserRaw),
        departmentHistory: editingUser.departmentHistory, // 元の職歴を保持
        department:
          editingUser.departmentHistory.find(d => !d.endDate)?.departmentName || null,
      };

      setUsers(prev =>
        prev.map(user => (user.id === editingUser.id ? updatedUser : user))
      );
      setEditingUser(null);

    } else {
      // 新規ユーザー登録
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Create failed");

      const createdRaw = await response.json();
      console.log("createdRaw ->", createdRaw);

      // ← ここを必ず camel のキーで参照する
      const deptHistory = createdRaw.departmentHistory?.map(mapDepartmentHistory) ?? [];

      // mapUser が departmentHistory を上書きする可能性があるなら、先に base を作って上書きする
      const baseUser = mapUser(createdRaw); // 既存の変換ロジック
      const createdUser = {
        ...baseUser,
        // 明示的に上書き（これをしないと mapUser のデフォルトが優先される）
        departmentHistory: deptHistory,
        department: deptHistory.find(d => !d.endDate)?.departmentName || null
      };

      setUsers(prev => [createdUser, ...prev]);

    }
  } catch (error) {
    console.error("handleUserSubmit error:", error);
    alert("登録に失敗しました");
  }
};
*/

const handleUserSubmit = async (data: UserFormData & { departmentHistory?: any[] }) => {
  try {
    if (editingUser) {
      // 既存ユーザー更新
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Update failed");
      const updatedUserRaw = await response.json();

      // サーバーから返された departmentHistory を map して利用
      const deptHistory = updatedUserRaw.departmentHistory?.map(mapDepartmentHistory) ?? [];

      const updatedUser = {
        ...mapUser(updatedUserRaw),
        departmentHistory: deptHistory,
        department: deptHistory.find(d => !d.endDate)?.departmentName || null,
      };

      setUsers(prev =>
        prev.map(user => (user.id === editingUser.id ? updatedUser : user))
      );
      setEditingUser(null);

    } else {
      // 新規ユーザー登録
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Create failed");

      const createdRaw = await response.json();
      console.log("createdRaw ->", createdRaw);

      const deptHistory = createdRaw.departmentHistory?.map(mapDepartmentHistory) ?? [];

      const baseUser = mapUser(createdRaw);
      const createdUser = {
        ...baseUser,
        departmentHistory: deptHistory,
        department: deptHistory.find(d => !d.endDate)?.departmentName || null,
      };

      setUsers(prev => [createdUser, ...prev]);
    }
  } catch (error) {
    console.error("handleUserSubmit error:", error);
    alert("登録に失敗しました");
  }
};

const handleGroupHomeSubmit = async (data: GroupHomeFormData) => {
  try {
    if (editingGroupHome) {
      // === 編集モード：PUT ===
      await axios.put(
        `${API_BASE_URL}/group-homes/${editingGroupHome.id}`,
        { 
          facilityCode:  data.facilityCode,
          propertyName:  data.propertyName,
          unitName:      data.unitName,
          postalCode:    data.postalCode,
          address:       data.address,
          phoneNumber:   data.phoneNumber,
          commonRoom:    data.commonRoom,
          residentRooms: data.residentRooms,
          openingDate:   data.openingDate,
          oldPropertyName: editingGroupHome.propertyName
        } 
      );
/*
      // ← 追加部分：expansionsテーブルも同期更新
      await axios.put(`${API_BASE_URL}/expansions/update-property-name`, {
        oldPropertyName: editingGroupHome.propertyName, // 変更前
        newPropertyName: data.propertyName              // 変更後
      });
*/

      alert("更新に成功しました！");
    } else {
      // === 新規登録：POST ===
      await axios.post(`${API_BASE_URL}/group-homes`, {
        facilityCode:  data.facilityCode,
        propertyName:  data.propertyName,
        unitName:      data.unitName,
        postalCode:    data.postalCode,
        address:       data.address,
        phoneNumber:   data.phoneNumber,
        commonRoom:    data.commonRoom,
        residentRooms: data.residentRooms,
        openingDate:   data.openingDate,
      });

      alert("登録に成功しました！");
    }

    // 一覧を最新化
//    fetchGroupHomes();
    const [
      groupHomesMainRes,
      groupHomesSubRes,
    ] = await Promise.all([
      fetchWithRetry("/api/group-homes/main"),
      fetchWithRetry("/api/group-homes/sub"),
    ]);

    setGroupHomesMain(ensureArray(groupHomesMainRes).map(mapGroupHome));
    setGroupHomesSub(ensureArray(groupHomesSubRes).map(mapGroupHome));

    // モーダルを閉じ、編集状態をリセット
    handleCloseGroupHomeModal();
  } catch (err) {
    console.error("保存エラー:", err);
    alert("保存に失敗しました");
  }
};


// ----------------------------------------------
// 🔁 汎用リトライ付き fetch ヘルパー
// ----------------------------------------------
async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T | null> {
  try {
    return await fn(); // ?ちゃんと返す
  } catch (err) {
    console.warn("初回失敗、リトライします...", err);
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1000));
      return withRetry(fn, retries - 1);
    } else {
      console.error("リトライ失敗:", err);
      return null;
    }
  }
}

const fetchGroupHomes = async () => {
  try {
    // 1. GH 一覧を取得
    const resHomes = await axios.get(`${API_BASE_URL}/group-homes/main`);
    const homes = resHomes.data;

    // 2. 増床記録を取得
    const resExpansions = await axios.get(`${API_BASE_URL}/expansions`);
    const expansionsRaw = resExpansions.data;

    console.log("raw homes:", homes);
    console.log("raw expansions:", expansionsRaw);

    // 3. expansions を camelCase に変換
    const expansions = expansionsRaw.map(mapExpansion);

    // 4. GH も mapGroupHome で camelCase 化して、expansions を結合
    const data = homes.map((gh: any) => {
      const ghCamel = mapGroupHome(gh);

      // GH ごとの expansions を取得
      const ghExpansions = expansions.filter(
        (ex) => ex.propertyName === ghCamel.propertyName
      );

      return {
        ...ghCamel,
        expansions: ghExpansions,
      };
    });

    // 5. state 更新
    setGroupHomesMain(data);
    setExpansionRecords(expansions);

    console.log("data:::::", data);
    console.log("expansions:::::", expansions);

    return data;
  } catch (err) {
    console.error("一覧取得エラー:", err);
    setGroupHomesMain([]);
    setExpansionRecords([]);
    return [];
  }
};

// =======================
// 🏠 MAIN（グループホーム一覧用）
// =======================
const fetchGroupHomesMain = async () => {
  try {
    const resHomes = await axios.get(`${API_BASE_URL}/group-homes/main`);
    const homes = resHomes.data;

    const resExpansions = await axios.get(`${API_BASE_URL}/expansions`);
    const expansionsRaw = resExpansions.data;
    const expansions = expansionsRaw.map(mapExpansion);

    const data = homes.map((gh: any) => {
      const ghCamel = mapGroupHome(gh);
      const ghExpansions = expansions.filter(
        (ex) => ex.propertyName === ghCamel.propertyName
      );
      return { ...ghCamel, expansions: ghExpansions };
    });

    setGroupHomesMain(data);
    setExpansionRecords(expansions);
    console.log("✅ MAIN 更新完了:", data);
    return data;
  } catch (err) {
    console.error("MAIN取得エラー:", err);
    setGroupHomesMain([]);
    return [];
  }
};

// =======================
// 🏠 SUB（利用者登録用）
// =======================
const fetchGroupHomesSub = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/group-homes/sub`);
    const subs = res.data.map(mapGroupHome);
    setGroupHomesSub(subs);
    console.log("✅ SUB 更新完了:", subs);
    return subs;
  } catch (err) {
    console.error("SUB取得エラー:", err);
    setGroupHomesSub([]);
    return [];
  }
};

// --- 利用者一覧取得 -----------------------------
// App.tsx どこか上に
const fetchResidents = async () => {
  console.log('fetchResidents(): 呼び出されたよ');
  try {
    const res = await axios.get(`${API_BASE_URL}/residents`);
    console.log('取得した利用者:', res.data);  // ← これ重要！

    setResidents(
      res.data.map((r: any) => ({
        id: r.id,
        name: r.name,
        nameKana: r.name_kana,
        disabilityLevel: r.disability_level,
        roomNumber: r.room_number,
        moveInDate: r.move_in_date,
        moveOutDate: r.move_out_date,
        groupHomeId: r.group_home_id,
        groupHomeName: r.group_home_name,  // ← 追加！！
        unitName: r.unit_name,             // ← 追加！！
        status: r.status,
        createdAt: r.created_at,
      }))
    );
  } catch (err) {
    console.error('fetchResidents() エラー:', err);
  }
};

const fetchExpansionRecords = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/expansions`);
    if (!response.ok) throw new Error("増床記録の取得に失敗しました");
    const data = await response.json();

    const parsedData = data.map((record) => ({
      id: record.id,
      propertyName: record.property_name,
      unitName: record.unit_name,
      expansionType: record.expansion_type,
      newRooms: Array.isArray(record.new_rooms)
        ? record.new_rooms
        : JSON.parse(record.new_rooms || "[]"),
      commonRoom: record.common_room,
      startDate: record.start_date,
      createdAt: record.created_at,
    }));

    setExpansionRecords(parsedData);
  } catch (error) {
    console.error("増床記録取得エラー:", error);
    setExpansionRecords([]);
  }
};

const refetchExpansionRecordsWithDelay = () => {
  // 0.1秒?0.2秒ぐらい待ってから呼ぶ
  setTimeout(() => {
    fetchExpansionRecords();
  }, 150);
};

const fetchDisabilityHistories = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/disability_histories`);
    console.log("取得した履歴:", res.data);

    setDisabilityHistories(
      res.data.map((d: any) => ({
        id: d.id,
        residentId: d.resident_id,
        disabilityLevel: d.disability_level,  // ? これが必要！
        startDate: d.start_date,
        endDate: d.end_date,
        createdAt: d.created_at,
      }))
    );

  } catch (err) {
    console.error("fetchDisabilityHistories() エラー:", err);
  }
};

// チャーママが優しく作ったよ?
const mapDisabilityHistory = (raw: any): DisabilityHistory => ({
  id: raw.id,
  residentId: raw.resident_id,
  disabilityLevel: raw.disability_level,
  startDate: raw.start_date,
  endDate: raw.end_date,
  createdAt: raw.created_at,
});

// 型注釈削ったバージョン
async function fetchWithRetry(url, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      console.error(`❌ ${url} の取得失敗 (${i + 1}/${retries}):`, err.message);
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
        console.log(`🔁 ${delay / 1000}秒後に再試行...`);
      } else {
        throw err;
      }
    }
  }
  throw new Error("fetchWithRetry: リトライ上限に達した");
}

useEffect(() => {
  const fetchData = async () => {
    try {
      const [
        residentsRes,
        historiesRes,
        usersRes,
        departmentHistoriesRes,
        groupHomesMainRes,
        groupHomesSubRes,
        expansionsRes
      ] = await Promise.all([
        fetchWithRetry("/api/residents"),
        fetchWithRetry("/api/disability_histories"),
        fetchWithRetry("/api/users"),
        fetchWithRetry("/api/department_histories"),
        fetchWithRetry("/api/group-homes/main"),
        fetchWithRetry("/api/group-homes/sub"),
        fetchWithRetry("/api/expansions")
      ]);

      setRawResidents(ensureArray(residentsRes).map(mapResident));
      setDisabilityHistories(ensureArray(historiesRes).map(mapDisabilityHistory));

      // ← ここは「生データ」を保持する
      setRawUsers(ensureArray(usersRes)); // mapはまだしない（マージ前）
      setDepartmentHistories(ensureArray(departmentHistoriesRes).map(mapDepartmentHistory));
      setGroupHomesMain(ensureArray(groupHomesMainRes).map(mapGroupHome));
      setGroupHomesSub(ensureArray(groupHomesSubRes).map(mapGroupHome));
      setExpansionRecords(ensureArray(expansionsRes).map(mapExpansion));

      // usageRecords 部分はそのまま residents を使う（略）

    } catch (err) {
      console.error("データ取得エラー:", err);
    }
  };

  fetchData();
}, []);

useEffect(() => {
  console.log("rawResidents.length before::", rawResidents.length);
  console.log("rawResidents.length after::", rawResidents.length);

  if (
    Array.isArray(rawResidents) && rawResidents.length > 0 &&
    Array.isArray(disabilityHistories) && disabilityHistories.length > 0
  ) {
  const mergedResidents = rawResidents.map((resident) => {
    const history = disabilityHistories
      .filter((h) => h.residentId === resident.id)
      .map((h) => ({
        id: h.id,
        startDate: h.startDate,
        endDate: h.endDate,
        level: h.disabilityLevel,
      }));
    return {
      ...resident,
      disabilityHistory: history,
    };
  });
  setResidents(mergedResidents);
  console.log("rawResidents:::", rawResidents);
  }
}, [rawResidents, disabilityHistories]);

// departmentHistories は既に map された camelCase 配列（mapDepartmentHistoryを通している想定）
useEffect(() => {
  // rawUsers はサーバ返却（snake_case） -> mapUser を使って camelCase に変換しつつ、departmentHistoryを紐付ける
  if (!Array.isArray(rawUsers)) {
    setUsers([]);
    return;
  }

  const deptByUserId = (departmentHistories || []).reduce((acc, dh) => {
    if (!dh || !dh.userId) return acc;
    if (!acc[dh.userId]) acc[dh.userId] = [];
    acc[dh.userId].push(dh);
    return acc;
  }, {} as Record<string, any[]>);

  const mappedUsers = rawUsers.map((raw: any) => {
    // raw -> フロント用に変換（mapUser が既にあるなら使う）
    // ただし mapUser が departmentHistory を期待しているなら、先に呼ぶとループするのでここでは基本fieldだけ手で作るか mapUserWithoutDept を使う
    const base = mapUser(raw); // mapUser が departmentHistory を参照しない形であることを想定
    const userId = base.id || String(raw.id);

    const deptHistoryForUser = deptByUserId[userId] || [];
    return {
      ...base,
      departmentHistory: deptHistoryForUser, // departmentHistory は既に mapDepartmentHistory により camelCase になってる想定
      // もし departmentName や department を current field として入れたいならここで計算
      department: deptHistoryForUser.find((d:any) => !d.endDate)?.departmentName || base.department || null
    };
  });

  setUsers(mappedUsers);
}, [rawUsers, departmentHistories]);

const handleExpansionSubmit = async (data: ExpansionFormData) => {
  console.log("handleExpansionSumbitのdata:::", data);
  try {
    if (editingExpansion) {
      // ===========================
      // ✏️ 編集モード
      // ===========================
      const res = await fetch(`/api/expansions/${editingExpansion.id}`, {
        method: 'PUT', // or 'PUT'
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('更新失敗');
      const result = await res.json();

      alert('増床情報を更新しました！');

      // ステート更新
      setExpansionRecords(prev =>
        prev.map(expansion =>
          expansion.id === editingExpansion.id
            ? { ...expansion, ...data, updatedAt: new Date().toISOString() }
            : expansion
        )
      );

      // MAIN / SUB 両方更新！
//      await Promise.all([fetchGroupHomesMain(), fetchGroupHomesSub()]);
      const [
        groupHomesMainRes,
        groupHomesSubRes,
        expansionsRes
      ] = await Promise.all([
        fetchWithRetry("/api/group-homes/main"),
        fetchWithRetry("/api/group-homes/sub"),
        fetchWithRetry("/api/expansions")
      ]);

      setGroupHomesMain(ensureArray(groupHomesMainRes).map(mapGroupHome));
      setGroupHomesSub(ensureArray(groupHomesSubRes).map(mapGroupHome));
      setExpansionRecords(ensureArray(expansionsRes).map(mapExpansion));

      // 編集モード解除
      setEditingExpansion(null);
      handleCloseExpansionModal();

    } else {
      // ===========================
      // 🆕 新規登録モード
      // ===========================
      const res = await fetch('/api/expansions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('登録失敗');
      const result = await res.json();

      alert('増床登録に成功しました！');

      const [
        groupHomesMainRes,
        groupHomesSubRes,
        expansionsRes
      ] = await Promise.all([
        fetchWithRetry("/api/group-homes/main"),
        fetchWithRetry("/api/group-homes/sub"),
        fetchWithRetry("/api/expansions")
      ]);

      setGroupHomesMain(ensureArray(groupHomesMainRes).map(mapGroupHome));
      setGroupHomesSub(ensureArray(groupHomesSubRes).map(mapGroupHome));
      setExpansionRecords(ensureArray(expansionsRes).map(mapExpansion));
      handleCloseExpansionModal();
    }
  } catch (err) {
    console.error('増床登録/更新エラー:', err);
    alert('登録または更新に失敗しました。');
  }
};

/*
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
*/

const handleDepartmentSubmit = (data: DepartmentFormData) => {
  if (editingDepartment) {
    // Edit existing department
    const oldDepartmentName = editingDepartment.name;
    const newDepartmentName = data.name;

    // Update department
    setDepartments(prev =>
      prev.map(department =>
        department.id === editingDepartment.id
          ? { ...department, ...data }
          : department
      )
    );

    // Update users' department history if department name changed
    if (oldDepartmentName !== newDepartmentName) {
      setUsers(prev =>
        prev.map(user => ({
          ...user,
          department:
            user.department === oldDepartmentName
              ? newDepartmentName
              : user.department,
          departmentHistory:
            user.departmentHistory?.map(h => {
              // ここで mapDepartmentHistory を通して camelCase に変換
              const history = mapDepartmentHistory(h);
              console.log("history:::", history);
              return {
                ...history,
                departmentName:
                  history.departmentName === oldDepartmentName
                    ? newDepartmentName
                    : history.departmentName
              };
            }) || []
        }))
      );
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

// App.tsx
const handleResidentSubmit = async (resident: Resident) => {
  console.log("送信された利用者:", resident);

  try {
    await fetchResidents(); // ? 一覧を更新
    await fetchDisabilityHistories();

    console.log("handleResidentSubmitのrawResidents:::", rawResidents);

    const fetchData = async () => {
      try {
        const [residentsRes,
               historiesRes,
        ] = await Promise.all([
          axios.get("/api/residents"),
          axios.get("/api/disability_histories")
        ]);

        console.log("? residents fetched:", residentsRes.data);
        console.log("? histories fetched:", historiesRes.data);

        setRawResidents(residentsRes.data.map(mapResident));
        setDisabilityHistories(historiesRes.map(mapDisabilityHistory));
  
      } catch (err) {
        console.error("データ取得エラー:", err);
      }
    };

    fetchData();
    alert("利用者を登録しました！"); // ? 成功メッセージ

  } catch (err) {
    console.error("利用者登録後の更新失敗:", err);
    alert("利用者一覧の取得に失敗しました。");
  }

  setIsResidentModalOpen(false); // ? モーダル閉じる
  setEditingResident(null);      // ? 編集状態解除
};

  /* ---------- 画面 ---------- */

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

  /* ---------- 追加ハンドラ ---------- */
  const handleOpenResidentModal = () => {
    setEditingResident(null);             // 新規登録なので null
    setIsResidentModalOpen(true);         // モーダルを開く
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };
/*
  const handleDeleteUser = (userId: string) => {
    if (window.confirm('この職員を削除してもよろしいですか？')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
      // 関連するシフト希望も削除
      setShiftPreferences(prev => prev.filter(pref => pref.userId !== userId));
    }
  };
*/

const handleDeleteUser = async (userId: string) => {
  if (!window.confirm('この職員を削除してもよろしいですか？')) return;

  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      alert(`削除できませんでした: ${data.message}`);
      return;
    }

    // 成功したらフロント側の状態も更新
    setUsers(prev => prev.filter(user => user.id !== userId));
    setShiftPreferences(prev => prev.filter(pref => pref.userId !== userId));
  } catch (err) {
    console.error(err);
    alert('削除中にエラーが発生しました');
  }
};

  const handleEditGroupHome = (groupHome: GroupHome) => {
    setEditingGroupHome(groupHome);
    setIsGroupHomeModalOpen(true);
  };

const handleDeleteGroupHome = async (groupHomeId: string) => {
  // 🔍 削除対象の物件情報を取得（expansions用にpropertyNameを残す）
  const targetGroupHome = groupHomesMain.find(gh => gh.id === groupHomeId);
  const deletedPropertyName = targetGroupHome?.propertyName;

  if (!window.confirm(`${deletedPropertyName ?? 'このグループホーム'} を削除してもよろしいですか？`)) return;

  try {
    // 🔥 DELETEリクエストを送信
    await axios.delete(`${API_BASE_URL}/group-homes/${groupHomeId}`);

    // ✅ group_homesリスト更新
    setGroupHomesMain(prev => prev.filter(gh => gh.id !== groupHomeId));

    // ✅ シフト希望情報の更新
    setShiftPreferences(prev => prev
      .map(pref => ({
        ...pref,
        preferences: pref.preferences.filter(ghPref => ghPref.groupHomeId !== groupHomeId)
      }))
      .filter(pref => pref.preferences.length > 0)
    );

    // ✅ 利用者リスト更新
    setResidents(prev => prev.filter(resident => resident.groupHomeId !== groupHomeId));

    // ✅ 🔥 増床記録(expansions)も削除
    if (deletedPropertyName) {
      setExpansionRecords(prev => prev.filter(exp => exp.propertyName !== deletedPropertyName));
    }

    alert('削除に成功しました');
  } catch (err) {
    console.error('削除エラー:', err);
    alert('削除に失敗しました');
  }
};

  const handleEditExpansion = (expansion: ExpansionRecord) => {
    setEditingExpansion(expansion);
    setIsExpansionModalOpen(true);
  };

/*
const handleDeleteExpansion = async (expansionId: string) => {
  if (!window.confirm('この増床記録を削除してもよろしいですか？')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/expansions/${expansionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('削除に失敗しました');

    // フロント側の状態からも削除
    setExpansionRecords(prev => prev.filter(exp => exp.id !== expansionId));
    alert('増床記録を削除しました');
  } catch (error) {
    console.error('増床削除エラー:', error);
    alert('削除に失敗しました');
  }
};
*/

const handleDeleteExpansion = async (expansionId: string) => {
  if (!window.confirm('この増床記録を削除してもよろしいですか？')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/expansions/${expansionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('削除に失敗しました');

    alert('増床記録を削除しました');

    // ✅ 削除後に「expansions」と「groupHomes」を再取得して完全同期
    const [expansionsRes, mainHomes, subHomes] = await Promise.all([
      axios.get(`${API_BASE_URL}/expansions`),
      fetchGroupHomesMain(),
      fetchGroupHomesSub(),
    ]);

    // 最新の expansions state を反映
    const expansionsUpdated = expansionsRes.data.map(mapExpansion);
    setExpansionRecords(expansionsUpdated);

  } catch (error) {
    console.error('増床削除エラー:', error);
    alert('削除に失敗しました');
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
  setEditingResident(resident);      // 編集対象をセット
  setIsResidentModalOpen(true);      // モーダルを開く
};

const handleDeleteResident = async (residentId: string) => {
  const confirmDelete = window.confirm('この利用者を削除してもよろしいですか？');
  if (!confirmDelete) return;

  try {
    // MySQLのデータも削除
    await axios.delete(`/api/residents/${residentId}`);

    // フロントエンド側の状態を更新（一覧から除外）
    setResidents(prev => prev.filter(resident => resident.id !== residentId));
    setUsageRecords(prev => prev.filter(record => record.residentId !== residentId));
  } catch (error) {
    console.error('削除に失敗しました', error);
    alert('削除に失敗しました');
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

const handleSubmitGroupHome = async (data: GroupHomeFormData) => {
  try {
    // 1️⃣ IDなどを生成（登録用）
    const newGroupHome: GroupHome = {
      ...data,
      createdAt: new Date().toISOString()     // ← 任意で付加
    };

    // 2️⃣ POST（DBに登録）
    await axios.post(`${API_BASE_URL}/group-homes`, newGroupHome);

    // 3️⃣ 表示用stateを更新 ← これがなかったから「登録しても見えない！」となってた
    setGroupHomesMain(prev => [...prev, newGroupHome]);

    // 4️⃣ モーダル閉じて編集モードリセット
    setIsGroupHomeModalOpen(false);
    setEditingGroupHome(null);
  } catch (err) {
    console.error('登録エラー:', err);
    alert('グループホームの登録に失敗しました');
  }
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

const handleCloseResidentModal = useCallback(() => {
  setIsResidentModalOpen(false);
}, []);



  return (
    <AuthProvider users={users}>
      <div className="p-4">
      </div>
      <ResidentModal
        isOpen={isResidentModalOpen}
        onClose={handleCloseResidentModal}  // ← これで毎回同じ関数インスタンスになる
        onSubmit={handleResidentSubmit}
        editResident={editingResident}
        groupHomes={groupHomesSub}
        expansionRecords={expansionRecords}
      />

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
                groupHomes={groupHomesSub}
                expansionRecords={expansionRecords}
                onResidentSubmit={handleResidentSubmit}
                onEditResident={handleEditResident}
                onDeleteResident={handleDeleteResident}
              />
            </PermissionGuard>
          )}

          {activeTab === 'usage' && (
            <PermissionGuard permissions={['user.view.all', 'user.create', 'user.edit']}>
              {console.log("residents*: ", residents)}
              {console.log("groupHomes*: ", groupHomesSub)}
              <UsageRecordPage
                residents={residents}
                groupHomes={groupHomesSub}
                expansionRecords={expansionRecords}
                usageRecords={usageRecords}
                onUsageRecordUpdate={handleUsageRecordUpdate}
              />
            </PermissionGuard>
          )}
          
          {activeTab === 'grouphomes' && (
            <PermissionGuard permissions={['grouphome.create', 'grouphome.edit', 'grouphome.delete']}>
              <GroupHomeList
                groupHomes={groupHomesMain}
                groupHomesSub={groupHomesSub}
                residents={residents}
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
              groupHomes={groupHomesMain}
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
            users={users}          // ← 追加
            setUsers={setUsers}    // ← 追加
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
            groupHomes={groupHomesMain}
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
