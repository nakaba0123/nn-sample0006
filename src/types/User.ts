export interface User {
  id: string;
  name: string;
  email: string;
  department: string; // 現在の部署（履歴から自動計算）
  position: string;
  employeeId: string;
  joinDate: string;
  retirementDate?: string; // 退職日（任意）
  status: 'active' | 'inactive';
  role: string; // ロール名を追加
  avatar?: string;
  createdAt: string;
  departmentHistory: DepartmentHistory[];
}

export interface UserFormData {
  name: string;
  email: string;
  department: string; // 初期部署
  position: string;
  employeeId: string;
  joinDate: string;
  retirementDate?: string; // 退職日（任意）
  status: 'active' | 'inactive';
  role: string; // ロールを追加
  departmentStartDate: string; // 初期部署の開始日
}

export interface DepartmentHistory {
  id: string;
  departmentName: string;
  startDate: string;
  endDate?: string; // 空の場合は現在所属中
  createdAt: string;
}

export interface DepartmentHistoryFormData {
  departmentName: string;
  startDate: string;
  endDate?: string;
}