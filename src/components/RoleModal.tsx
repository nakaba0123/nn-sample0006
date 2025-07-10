import React, { useState, useEffect } from 'react';
import { X, Shield, Key, Users, Lock, Hash, Eye, Code, CheckSquare, Square, Minus } from 'lucide-react';
import { Role, RoleFormData, Permission } from '../types/Role';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormData) => void;
  editRole?: Role | null;
  availablePermissions: Permission[];
}

const RoleModal: React.FC<RoleModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editRole,
  availablePermissions
}) => {
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    displayName: '',
    description: '',
    permissions: []
  });

  const [errors, setErrors] = useState<Partial<RoleFormData>>({});

  useEffect(() => {
    if (editRole) {
      setFormData({
        name: editRole.name,
        displayName: editRole.displayName,
        description: editRole.description,
        permissions: editRole.permissions.map(p => p.name)
      });
    } else {
      setFormData({
        name: '',
        displayName: '',
        description: '',
        permissions: []
      });
    }
  }, [editRole, isOpen]);

  // 表示名からロールIDを自動生成する関数
  const generateRoleId = (displayName: string): string => {
    if (!displayName.trim()) return '';
    
    // 日本語を英語に変換するマッピング
    const japaneseToEnglish: { [key: string]: string } = {
      '管理者': 'admin',
      'かんりしゃ': 'admin',
      '職員': 'staff',
      'しょくいん': 'staff',
      '一般職員': 'staff',
      '給与担当': 'payroll',
      'きゅうよたんとう': 'payroll',
      '給与担当者': 'payroll',
      'マネージャー': 'manager',
      'まねーじゃー': 'manager',
      'リーダー': 'leader',
      'りーだー': 'leader',
      'チームリーダー': 'team_leader',
      'ちーむりーだー': 'team_leader',
      '主任': 'supervisor',
      'しゅにん': 'supervisor',
      '課長': 'section_chief',
      'かちょう': 'section_chief',
      '部長': 'department_head',
      'ぶちょう': 'department_head',
      'サービス管理責任者': 'service_manager',
      'さーびすかんりせきにんしゃ': 'service_manager',
      '看護師': 'nurse',
      'かんごし': 'nurse',
      '介護士': 'caregiver',
      'かいごし': 'caregiver',
      'ケアマネ': 'care_manager',
      'けあまね': 'care_manager',
      'ケアマネージャー': 'care_manager',
      'けあまねーじゃー': 'care_manager',
      '相談員': 'counselor',
      'そうだんいん': 'counselor',
      '事務': 'clerk',
      'じむ': 'clerk',
      '事務員': 'clerk',
      'じむいん': 'clerk'
    };

    // まず日本語マッピングをチェック
    const lowerDisplayName = displayName.toLowerCase().trim();
    if (japaneseToEnglish[lowerDisplayName]) {
      return japaneseToEnglish[lowerDisplayName];
    }

    // 日本語マッピングにない場合は、文字変換処理
    return displayName
      .toLowerCase()
      .trim()
      // 日本語の文字を削除（ひらがな、カタカナ、漢字）
      .replace(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '')
      // 特殊文字を除去
      .replace(/[^\w\s]/g, '')
      // 複数のスペースを1つに
      .replace(/\s+/g, ' ')
      // スペースをアンダースコアに変換
      .replace(/\s/g, '_')
      // 英数字とアンダースコア以外を除去
      .replace(/[^a-z0-9_]/g, '')
      // 先頭と末尾のアンダースコアを除去
      .replace(/^_+|_+$/g, '')
      // 連続するアンダースコアを1つに
      .replace(/_+/g, '_')
      // 空の場合はデフォルト値
      || 'custom_role';
  };

  // 表示名が変更されたときにロールIDを自動生成
  const handleDisplayNameChange = (value: string) => {
    const newFormData = {
      ...formData,
      displayName: value
    };

    // 新規登録時のみ自動生成
    if (!editRole) {
      newFormData.name = generateRoleId(value);
    }

    setFormData(newFormData);
    
    if (errors.displayName) {
      setErrors(prev => ({ ...prev, displayName: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RoleFormData> = {};
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'ロール表示名を入力してください';
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'ロールIDを入力してください';
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.name)) {
      newErrors.name = 'ロールIDは英字またはアンダースコアで始まり、英数字とアンダースコアのみ使用可能です';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '説明を入力してください';
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = '少なくとも1つの権限を選択してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      setFormData({
        name: '',
        displayName: '',
        description: '',
        permissions: []
      });
      setErrors({});
      onClose();
    }
  };

  const handleInputChange = (field: keyof RoleFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePermissionToggle = (permissionName: string) => {
    const newPermissions = formData.permissions.includes(permissionName)
      ? formData.permissions.filter(p => p !== permissionName)
      : [...formData.permissions, permissionName];
    
    handleInputChange('permissions', newPermissions);
  };

  // 全権限の一括選択/解除
  const handleSelectAllPermissions = () => {
    const allPermissionNames = availablePermissions.map(p => p.name);
    handleInputChange('permissions', allPermissionNames);
  };

  const handleDeselectAllPermissions = () => {
    handleInputChange('permissions', []);
  };

  // セクション単位の一括選択/解除
  const handleSectionToggle = (category: string, permissions: Permission[]) => {
    const sectionPermissionNames = permissions.map(p => p.name);
    const allSelected = sectionPermissionNames.every(name => formData.permissions.includes(name));
    
    if (allSelected) {
      // 全て選択済みの場合は解除
      const newPermissions = formData.permissions.filter(name => !sectionPermissionNames.includes(name));
      handleInputChange('permissions', newPermissions);
    } else {
      // 一部または全て未選択の場合は全選択
      const newPermissions = [...new Set([...formData.permissions, ...sectionPermissionNames])];
      handleInputChange('permissions', newPermissions);
    }
  };

  // セクションの選択状態を取得
  const getSectionSelectionState = (permissions: Permission[]) => {
    const sectionPermissionNames = permissions.map(p => p.name);
    const selectedCount = sectionPermissionNames.filter(name => formData.permissions.includes(name)).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === sectionPermissionNames.length) return 'all';
    return 'partial';
  };

  const groupedPermissions = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const isSystemRole = editRole && ['admin', 'staff', 'payroll'].includes(editRole.name);

  // 全体の選択状態を取得
  const totalPermissions = availablePermissions.length;
  const selectedPermissions = formData.permissions.length;
  const allSelected = selectedPermissions === totalPermissions;
  const noneSelected = selectedPermissions === 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {editRole ? 'ロール編集' : '新規ロール登録'}
              </h2>
              {isSystemRole && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 mt-1">
                  <Lock className="w-3 h-3 mr-1" />
                  システムロール（編集制限あり）
                </span>
              )}
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
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              基本情報
            </h3>
            
            <div className="space-y-5">
              {/* ロール表示名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Eye className="w-4 h-4 inline mr-2" />
                  ロール表示名 *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.displayName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="例: 管理者、主任、課長、チームリーダー、サービス管理責任者"
                />
                {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>}
                <p className="text-sm text-blue-700 mt-1">
                  💡 ユーザーに表示される名前です。日本語や全角文字も使用できます
                </p>
              </div>

              {/* ロールID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Code className="w-4 h-4 inline mr-2" />
                  ロールID（システム内部用） *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="例: manager, team_leader, supervisor"
                  disabled={isSystemRole}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                <div className="bg-gray-50 rounded-lg p-3 mt-2 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">
                    <Hash className="w-3 h-3 inline mr-1" />
                    <strong>これはシステム内部で使用される識別子です</strong>
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• 英字またはアンダースコア（_）で始める必要があります</li>
                    <li>• 英数字とアンダースコア（_）のみ使用可能です</li>
                    {!editRole && (
                      <li className="text-green-600 font-medium">• 表示名を入力すると自動で生成されます（手動変更も可能）</li>
                    )}
                    <li>• 一度登録後は変更できません</li>
                  </ul>
                  {!editRole && formData.displayName && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-700">
                        <strong>自動生成例:</strong> 「{formData.displayName}」→「{generateRoleId(formData.displayName)}」
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 説明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  説明 *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="このロールの役割や責任について説明してください"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
            </div>
          </div>

          {/* 権限設定 */}
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-medium text-purple-800">権限設定 *</h3>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                  {formData.permissions.length}/{totalPermissions}個選択中
                </span>
              </div>
              
              {/* 全体一括選択ボタン */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAllPermissions}
                  disabled={allSelected || isSystemRole}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-1 ${
                    allSelected || isSystemRole
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>すべて選択</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllPermissions}
                  disabled={noneSelected || isSystemRole}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-1 ${
                    noneSelected || isSystemRole
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  <span>すべて解除</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, permissions]) => {
                const selectionState = getSectionSelectionState(permissions);
                const selectedInSection = permissions.filter(p => formData.permissions.includes(p.name)).length;
                
                return (
                  <div key={category} className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-700 flex items-center space-x-2">
                        <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                        <span>{category}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {selectedInSection}/{permissions.length}
                        </span>
                      </h4>
                      
                      {/* セクション単位の一括選択ボタン */}
                      <button
                        type="button"
                        onClick={() => handleSectionToggle(category, permissions)}
                        disabled={isSystemRole}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center space-x-1 ${
                          isSystemRole
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : selectionState === 'all'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {selectionState === 'all' ? (
                          <>
                            <Square className="w-3 h-3" />
                            <span>全解除</span>
                          </>
                        ) : selectionState === 'partial' ? (
                          <>
                            <Minus className="w-3 h-3" />
                            <span>全選択</span>
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-3 h-3" />
                            <span>全選択</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {permissions.map((permission) => (
                        <label
                          key={permission.id}
                          className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            formData.permissions.includes(permission.name)
                              ? 'bg-purple-50 border-purple-200 shadow-sm'
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.name)}
                            onChange={() => handlePermissionToggle(permission.name)}
                            className="mt-1 text-purple-600 focus:ring-purple-500"
                            disabled={isSystemRole}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 text-sm">
                              {permission.displayName}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {permission.description}
                            </div>
                            <div className="text-xs text-purple-600 mt-1 font-mono">
                              {permission.name}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {errors.permissions && <p className="text-red-500 text-sm mt-3">{errors.permissions}</p>}
            
            {/* 一括操作のヘルプ */}
            <div className="bg-indigo-50 rounded-lg p-3 mt-4 border border-indigo-200">
              <h5 className="text-sm font-medium text-indigo-800 mb-2">💡 効率的な権限設定のヒント</h5>
              <div className="text-xs text-indigo-700 space-y-1">
                <p>• <strong>「すべて選択」</strong>: 全権限を一括で選択（管理者ロール作成時に便利）</p>
                <p>• <strong>「すべて解除」</strong>: 全権限を一括で解除（最小権限から設定したい場合）</p>
                <p>• <strong>セクション単位の操作</strong>: 各カテゴリごとに一括選択/解除が可能</p>
                <p>• セクションの選択状態に応じてボタン表示が自動で切り替わります</p>
              </div>
            </div>
          </div>

          {/* プレビュー */}
          {formData.displayName && formData.name && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h4 className="font-medium text-green-800 mb-3 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                登録内容プレビュー
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="text-green-700 font-medium">表示名:</span>
                    <span className="ml-2 text-green-800">{formData.displayName}</span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">ロールID:</span>
                    <span className="ml-2 text-green-800 font-mono text-xs">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-green-700 font-medium">権限数:</span>
                    <span className="ml-2 text-green-800">{formData.permissions.length}/{totalPermissions}個</span>
                  </div>
                </div>
                <div>
                  <span className="text-green-700 font-medium">説明:</span>
                  <p className="text-green-800 text-xs mt-1">{formData.description}</p>
                </div>
              </div>
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
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              disabled={isSystemRole}
            >
              {editRole ? '更新' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleModal;