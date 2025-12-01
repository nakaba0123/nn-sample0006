export interface GroupHome {
  id: string;
  propertyName: string;
  unitName: string;
  postalCode: string;
  address: string;
  phoneNumber: string;
  commonRoom: string;
  residentRooms: string[];
  openingDate: string;
  createdAt: string;
  facilityCode: string;
}

export interface GroupHomeFormData {
  propertyName: string;
  unitName: string;
  postalCode: string;
  address: string;
  phoneNumber: string;
  commonRoom: string;
  residentRooms: string[];
  openingDate: string;
  facilityCode: string;
}

export interface ExpansionRecord {
  id: string;
  propertyName: string;
  unitName: string;
  expansionType: 'A' | 'B';
  newRooms: string[];
  commonRoom?: string; // タイプAの場合のみ
  startDate: string;
  timestamp: string;
  facilityCode?: string;   // ← ★ 追加
}

export interface ExpansionFormData {
  propertyName: string;
  unitName: string;
  expansionType: 'A' | 'B';
  newRooms: string[];
  commonRoom?: string; // タイプAの場合のみ
  startDate: string;
  facilityCode?: string;   // ← ★ 追加
}
