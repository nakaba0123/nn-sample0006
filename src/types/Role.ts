export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  category: string;
  description: string;
}

export interface RoleFormData {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
}

// 定義済みのロール
export const DEFAULT_ROLES: Omit<Role, 'id' | 'createdAt'>[] = [
  {
    name: 'admin',
    displayName: '管理者',
    description: 'システム全体の管理権限',
    permissions: [
      { id: 'user.create', name: 'user.create', displayName: '職員登録', category: '職員管理', description: '新規職員の登録' },
      { id: 'user.edit', name: 'user.edit', displayName: '職員編集', category: '職員管理', description: '職員情報の編集' },
      { id: 'user.delete', name: 'user.delete', displayName: '職員削除', category: '職員管理', description: '職員の削除' },
      { id: 'user.view.all', name: 'user.view.all', displayName: '全職員閲覧', category: '職員管理', description: '全職員の情報閲覧' },
      { id: 'attendance.view.all', name: 'attendance.view.all', displayName: '全出勤記録閲覧', category: '出勤管理', description: '全職員の出勤記録閲覧' },
      { id: 'attendance.manage', name: 'attendance.manage', displayName: '出勤管理', category: '出勤管理', description: '出勤記録の管理・集計' },
      { id: 'grouphome.create', name: 'grouphome.create', displayName: 'GH登録', category: 'グループホーム', description: 'グループホーム登録' },
      { id: 'grouphome.edit', name: 'grouphome.edit', displayName: 'GH編集', category: 'グループホーム', description: 'グループホーム編集' },
      { id: 'grouphome.delete', name: 'grouphome.delete', displayName: 'GH削除', category: 'グループホーム', description: 'グループホーム削除' },
      { id: 'department.manage', name: 'department.manage', displayName: '部署管理', category: '部署管理', description: '部署マスタの管理' },
      { id: 'shift.create', name: 'shift.create', displayName: 'シフト作成', category: 'シフト管理', description: 'シフト予定の作成' },
      { id: 'shift.edit', name: 'shift.edit', displayName: 'シフト編集', category: 'シフト管理', description: 'シフト予定の編集' },
      { id: 'shift.view.all', name: 'shift.view.all', displayName: '全シフト閲覧', category: 'シフト管理', description: '全職員のシフト閲覧' },
      { id: 'shift.preference.view.all', name: 'shift.preference.view.all', displayName: '全希望閲覧', category: 'シフト管理', description: '全職員のシフト希望閲覧' },
      { id: 'system.settings', name: 'system.settings', displayName: 'システム設定', category: 'システム', description: 'システム全体の設定' }
    ]
  },
  {
    name: 'staff',
    displayName: '一般職員',
    description: '基本的な職員権限',
    permissions: [
      { id: 'attendance.report.own', name: 'attendance.report.own', displayName: '自分の出勤報告', category: '出勤管理', description: '自分の出勤報告' },
      { id: 'attendance.view.own', name: 'attendance.view.own', displayName: '自分の出勤記録閲覧', category: '出勤管理', description: '自分の出勤記録閲覧' },
      { id: 'shift.view.all', name: 'shift.view.all', displayName: 'シフト予定閲覧', category: 'シフト管理', description: 'シフト予定の閲覧' },
      { id: 'shift.preference.own', name: 'shift.preference.own', displayName: '自分のシフト希望', category: 'シフト管理', description: '自分のシフト希望の登録・編集' },
      { id: 'user.view.own', name: 'user.view.own', displayName: '自分の情報閲覧', category: '職員管理', description: '自分の職員情報閲覧' }
    ]
  },
  {
    name: 'payroll',
    displayName: '給与担当者',
    description: '給与計算・勤怠管理権限',
    permissions: [
      { id: 'attendance.view.all', name: 'attendance.view.all', displayName: '全出勤記録閲覧', category: '出勤管理', description: '全職員の出勤記録閲覧' },
      { id: 'attendance.manage', name: 'attendance.manage', displayName: '出勤管理', category: '出勤管理', description: '出勤記録の管理・集計' },
      { id: 'user.view.all', name: 'user.view.all', displayName: '全職員閲覧', category: '職員管理', description: '全職員の情報閲覧' },
      { id: 'shift.view.all', name: 'shift.view.all', displayName: '全シフト閲覧', category: 'シフト管理', description: '全職員のシフト閲覧' },
      { id: 'shift.preference.view.all', name: 'shift.preference.view.all', displayName: '全希望閲覧', category: 'シフト管理', description: '全職員のシフト希望閲覧' }
    ]
  }
];