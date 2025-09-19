// 部署履歴の型変換
export const mapDepartmentHistory = (history: any) => ({
  id: history.id,
  userId: history.user_id,
  departmentName: history.department_name,
  startDate: history.start_date ? new Date(history.start_date).toISOString() : null,
  endDate: history.end_date ? new Date(history.end_date).toISOString() : null,
});

export function mapUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    position: user.position,
    employeeId: user.employee_id,
    role: user.role,
    status: user.status,
    department: user.department || null,

    joinDate: user.join_date ? new Date(user.join_date).toISOString() : null,
    retirementDate: user.retirement_date ? new Date(user.retirement_date).toISOString() : null,
    createdAt: user.created_at ? new Date(user.created_at).toISOString() : null,

    avatar: user.avatar || null,
  };
)

