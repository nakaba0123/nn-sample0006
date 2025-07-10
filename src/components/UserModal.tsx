import React, { useState, useEffect } from 'react';
import { X, User, Mail, Building, Briefcase, Calendar, Hash, UserCheck, Plus, History, LogOut, Shield } from 'lucide-react';
import { User as UserType, UserFormData, DepartmentHistory, DepartmentHistoryFormData } from '../types/User';
import { Department } from '../types/Department';
import { useAuth } from '../hooks/useAuth';
import DepartmentHistoryCard from './DepartmentHistoryCard';
import DepartmentHistoryModal from './DepartmentHistoryModal';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  editUser?: UserType | null;
  departments: Department[];
}

const UserModal: React.FC<UserModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editUser,
  departments 
}) => {
  const { roles } = useAuth();
  
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    department: '',
    position: '',
    employeeId: '',
    joinDate: '',
    retirementDate: '',
    status: 'active',
    role: 'staff', // デフォルトは一般職員
    departmentStartDate: ''
  });

  const [departmentHistory, setDepartmentHistory] = useState<DepartmentHistory[]>([]);
  const [isDepartmentHistoryModalOpen, setIsDepartmentHistoryModalOpen] = useState(false);
  const [editingHistory, setEditingHistory] = useState<DepartmentHistory | null>(null);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  useEffect(() => {
    if (editUser) {
      // 現在の部署を履歴から取得
      const currentDepartment = editUser.departmentHistory.find(h => !h.endDate)?.departmentName || '';
      
      setFormData({
        name: editUser.name,
        email: editUser.email,
        department: currentDepartment,
        position: editUser.position,
        employeeId: editUser.employeeId,
        joinDate: editUser.joinDate,
        retirementDate: editUser.retirementDate || '',
        status: editUser.status,
        role: editUser.role || 'staff',
        departmentStartDate: editUser.departmentHistory[0]?.startDate || ''
      });
      setDepartmentHistory(editUser.departmentHistory);
    } else {
      setFormData({
        name: '',
        email: '',
        department: '',
        position: '',
        employeeId: '',
        joinDate: '',
        retirementDate: '',
        status: 'active',
        role: 'staff',
        departmentStartDate: ''
      });
      setDepartmentHistory([]);
    }
  }, [editUser, isOpen]);

  // ステータスを自動判定する関数
  const getAutoStatus = (retirementDate?: string): 'active' | 'inactive' => {
    if (!retirementDate) return 'active';
    const today = new Date();
    const retirement = new Date(retirementDate);
    return retirement <= today ? 'inactive' : 'active';
  };

  // 退職日が変更されたときにステータスを自動更新
  useEffect(() => {
    const autoStatus = getAutoStatus(formData.retirementDate);
    if (formData.status !== autoStatus) {
      setFormData(prev => ({ ...prev, status: autoStatus }));
    }
  }, [formData.retirementDate]);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '名前を入力してください';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    
    if (!editUser && !formData.department.trim()) {
      newErrors.department = '初期部署を選択してください';
    }
    
    if (!formData.joinDate) {
      newErrors.joinDate = '入社日を入力してください';
    }

    if (!formData.role) {
      newErrors.role = 'ロールを選択してください';
    }

    // 退職日の検証
    if (formData.retirementDate) {
      if (formData.joinDate && formData.retirementDate <= formData.joinDate) {
        newErrors.retirementDate = '退職日は入社日より後にしてください';
      }
    }

    if (!editUser && !formData.departmentStartDate) {
      newErrors.departmentStartDate = '部署開始日を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // 新規登録の場合は初期部署履歴を作成
      let finalDepartmentHistory = departmentHistory;
      
      if (!editUser && formData.department && formData.departmentStartDate) {
        const initialHistory: DepartmentHistory = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          departmentName: formData.department,
          startDate: formData.departmentStartDate,
          createdAt: new Date().toISOString()
        };
        finalDepartmentHistory = [initialHistory];
      }

      // UserFormDataを拡張してdepartmentHistoryを含める
      const submitData = {
        ...formData,
        retirementDate: formData.retirementDate || undefined,
        status: getAutoStatus(formData.retirementDate), // 最終的なステータスを自動判定
        departmentHistory: finalDepartmentHistory
      };

      onSubmit(submitData);
      
      setFormData({
        name: '',
        email: '',
        department: '',
        position: '',
        employeeId: '',
        joinDate: '',
        retirementDate: '',
        status: 'active',
        role: 'staff',
        departmentStartDate: ''
      });
      setDepartmentHistory([]);
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDepartmentHistorySubmit = (data: DepartmentHistoryFormData) => {
    if (editingHistory) {
      // 編集
      setDepartmentHistory(prev => prev.map(history => 
        history.id === editingHistory.id 
          ? { ...history, ...data }
          : history
      ));
      setEditingHistory(null);
    } else {
      // 新規追加
      const newHistory: DepartmentHistory = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date().toISOString()
      };
      setDepartmentHistory(prev => [...prev, newHistory]);
    }
    setIsDepartmentHistoryModalOpen(false);
  };

  const handleEditHistory = (history: DepartmentHistory) => {
    // イベントの伝播を防ぐ
    setEditingHistory(history);
    setIsDepartmentHistoryModalOpen(true);
  };

  const handleDeleteHistory = (historyId: string) => {
    if (window.confirm('この部署履歴を削除してもよろしいですか？')) {
      setDepartmentHistory(prev => prev.filter(h => h.id !== historyId));
    }
  };

  const handleAddHistory = () => {
    setEditingHistory(null);
    setIsDepartmentHistoryModalOpen(true);
  };

  const handleCloseDepartmentHistoryModal = () => {
    setIsDepartmentHistoryModalOpen(false);
    setEditingHistory(null);
  };

  // 現在の部署を取得
  const currentDepartment = departmentHistory.find(h => !h.endDate)?.departmentName || '未設定';

  // ステータス表示用のテキストと色を取得
  const getStatusDisplay = (status: 'active' | 'inactive') => {
    return status === 'active' 
      ? { text: '在職中', color: 'text-green-700 bg-green-100' }
      : { text: '退職済み', color: 'text-red-700 bg-red-100' };
  };

  // ロール表示用の情報を取得
  const getRoleDisplay = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    return role ? role.displayName : roleName;
  };

  const getRoleDescription = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    return role ? role.description : '';
  };

  const statusDisplay = getStatusDisplay(formData.status);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
          <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {editUser ? '職員情報編集' : '新規職員登録'}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  {formData.retirementDate && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                      {statusDisplay.text}（自動判定）
                    </span>
                  )}
                  {formData.role && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <Shield className="w-3 h-3 mr-1" />
                      {getRoleDisplay(formData.role)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  名前 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="山田太郎"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  メールアドレス *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="yamada@company.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  役職
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="主任、課長、部長など（任意）"
                />
                <p className="text-sm text-gray-500 mt-1">任意項目です</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-2" />
                  社員ID
                </label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="EMP001（任意）"
                />
                <p className="text-sm text-gray-500 mt-1">任意項目です</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  入社日 *
                </label>
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => handleInputChange('joinDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    errors.joinDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.joinDate && <p className="text-red-500 text-sm mt-1">{errors.joinDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <LogOut className="w-4 h-4 inline mr-2" />
                  退職日
                </label>
                <input
                  type="date"
                  value={formData.retirementDate}
                  onChange={(e) => handleInputChange('retirementDate', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                    errors.retirementDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.retirementDate && <p className="text-red-500 text-sm mt-1">{errors.retirementDate}</p>}
                <p className="text-sm text-gray-500 mt-1">
                  空欄の場合は在職中として扱われます
                </p>
              </div>
            </div>

            {/* ロール設定 */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                アクセス権限設定
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ロール（役割） *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.role ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">ロールを選択</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>
                      {role.displayName} - {role.description}
                    </option>
                  ))}
                </select>
                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                {formData.role && (
                  <p className="text-sm text-blue-700 mt-2">
                    💡 {getRoleDescription(formData.role)}
                  </p>
                )}
              </div>
            </div>

            {/* ステータス表示（自動判定） */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-3">
                <UserCheck className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="font-medium text-gray-800">在籍ステータス（自動判定）</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formData.retirementDate 
                        ? `退職日: ${new Date(formData.retirementDate).toLocaleDateString('ja-JP')}` 
                        : '退職日未設定'
                      }
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 退職日が設定されている場合、その日付に基づいて自動的にステータスが判定されます
                  </p>
                </div>
              </div>
            </div>

            {/* 初期部署設定（新規登録時のみ） */}
            {!editUser && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-medium text-green-800 mb-3">初期部署設定</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building className="w-4 h-4 inline mr-2" />
                      初期部署 *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        errors.department ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">部署を選択</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                    {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      部署開始日 *
                    </label>
                    <input
                      type="date"
                      value={formData.departmentStartDate}
                      onChange={(e) => handleInputChange('departmentStartDate', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        errors.departmentStartDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.departmentStartDate && <p className="text-red-500 text-sm mt-1">{errors.departmentStartDate}</p>}
                  </div>
                </div>
                {departments.length === 0 && (
                  <p className="text-amber-600 text-sm mt-2">
                    💡 部署マスタで部署を登録してください
                  </p>
                )}
              </div>
            )}

            {/* 部署履歴（編集時のみ） */}
            {editUser && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <History className="w-5 h-5 text-gray-600" />
                    <h3 className="font-medium text-gray-800">部署履歴</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      現在: {currentDepartment}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddHistory}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>履歴追加</span>
                  </button>
                </div>

                {departmentHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">部署履歴がありません</p>
                    <p className="text-gray-400 text-xs">「履歴追加」ボタンから追加してください</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departmentHistory
                      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                      .map((history) => (
                        <DepartmentHistoryCard
                          key={history.id}
                          history={history}
                          onEdit={handleEditHistory}
                          onDelete={handleDeleteHistory}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                {editUser ? '更新' : '登録'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 部署履歴モーダル - より高いz-indexで表示 */}
      <DepartmentHistoryModal
        isOpen={isDepartmentHistoryModalOpen}
        onClose={handleCloseDepartmentHistoryModal}
        onSubmit={handleDepartmentHistorySubmit}
        editHistory={editingHistory}
        departments={departments}
        existingHistory={departmentHistory}
      />
    </>
  );
};

export default UserModal;