export interface Resident {
  id: string;
  name: string;
  nameKana: string;
  disabilityLevel: '1以下' | '2' | '3' | '4' | '5' | '6'; // 現在の区分（履歴から自動計算）
  disabilityHistory: DisabilityHistory[]; // 障害支援区分履歴
  groupHomeId: string;
  groupHomeName: string;
  unitName: string;
  roomNumber: string;
  moveInDate?: string;
  moveOutDate?: string;
  status: 'active' | 'inactive'; // 入居中/退居済み
  createdAt: string;
  updatedAt: string;
}

export interface DisabilityHistory {
  id: string;
  disabilityLevel: '1以下' | '2' | '3' | '4' | '5' | '6';
  startDate: string;
  endDate?: string; // 空の場合は現在適用中
  createdAt: string;
}

export interface DisabilityHistoryFormData {
  residentId: number; // ? 必要！
  disabilityLevel: '1以下' | '2' | '3' | '4' | '5' | '6';
  startDate: string;
  endDate?: string;
}

export interface ResidentFormData {
  name: string;
  nameKana: string;
  disabilityLevel: '1以下' | '2' | '3' | '4' | '5' | '6'; // 初期区分
  disabilityStartDate: string; // 初期区分の開始日
  groupHomeId: string;
  groupHomeName: string; // 🔺追加
  unitName: string;      // 🔺追加
  roomNumber: string;
  moveInDate?: string;
  moveOutDate?: string;
}
