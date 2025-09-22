// src/util/mapUser.ts

// 部署履歴の型変換（既存のまま安全ガード追加）
export const mapDepartmentHistory = (history: any) => {
  if (!history) return null;
  return {
    id: history.id ?? null,
    userId: history.user_id ?? history.userId ?? null,
    departmentName: history.department_name ?? history.departmentName ?? null,
    startDate: history.start_date ? new Date(history.start_date).toISOString() : (history.startDate ? new Date(history.startDate).toISOString() : null),
    endDate: history.end_date ? new Date(history.end_date).toISOString() : (history.endDate ? new Date(history.endDate).toISOString() : null),
    createdAt: history.created_at ? new Date(history.created_at).toISOString() : (history.createdAt ? new Date(history.createdAt).toISOString() : null)
  };
};

// ユーザーの基本フィールドのみマッピング（departmentHistory を含めない）
export const mapUserBase = (user: any) => {
  if (!user) return null;
  return {
    id: user.id ?? null,
    name: user.name ?? user.full_name ?? "",
    email: user.email ?? "",
    position: user.position ?? null,
    employeeId: user.employee_id ?? user.employeeId ?? null,
    role: user.role ?? null,
    status: user.status ?? null,
    department: user.department ?? null,
    joinDate: user.join_date ? new Date(user.join_date).toISOString() : (user.joinDate ? new Date(user.joinDate).toISOString() : null),
    retirementDate: user.retirement_date ? new Date(user.retirement_date).toISOString() : (user.retirementDate ? new Date(user.retirementDate).toISOString() : null),
    createdAt: user.created_at ? new Date(user.created_at).toISOString() : (user.createdAt ? new Date(user.createdAt).toISOString() : null),
    avatar: user.avatar ?? null,
    // 他に使うフィールドがあればここに追加
  };
};

// departmentHistory配列をマージして最終的な user オブジェクトを作る
export const mapUserWithDept = (rawUser: any, departmentHistoriesForUser: any[] = []) => {
  const base = mapUserBase(rawUser) || { id: null, name: "", email: "" };

  // departmentHistoriesForUser が snake_case の要素なら mapDepartmentHistory を通す
  const deptArray = Array.isArray(departmentHistoriesForUser)
    ? departmentHistoriesForUser.map(mapDepartmentHistory).filter(Boolean)
    : [];

  // 現在所属（endDate が無い最新履歴）から department を上書きする（必要なら）
  const currentDept = deptArray.find((d: any) => !d.endDate) || null;

  return {
    ...base,
    departmentHistory: deptArray,
    department: base.department || (currentDept ? currentDept.departmentName : null)
  };
};

// 既存の単純 mapUser の互換エイリアス（必要なら外部で使えるように export）
export const mapUser = (user: any) => mapUserBase(user);

