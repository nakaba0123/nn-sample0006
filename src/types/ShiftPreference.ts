export interface ShiftPreference {
  id: string;
  userId: string;
  userName: string;
  targetYear: number;
  targetMonth: number;
  preferences: GroupHomePreference[];
  notes?: string; // 自由記述欄
  createdAt: string;
  updatedAt: string;
}

export interface GroupHomePreference {
  groupHomeId: string;
  groupHomeName: string;
  unitName: string;
  desiredDays: number; // 希望勤務日数
}

export interface ShiftPreferenceFormData {
  userId: string;
  targetYear: number;
  targetMonth: number;
  preferences: GroupHomePreference[];
  notes?: string;
}