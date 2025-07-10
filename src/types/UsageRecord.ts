export interface UsageRecord {
  id: string;
  residentId: string;
  date: string; // YYYY-MM-DD形式
  isUsed: boolean; // 利用したかどうか
  disabilityLevel: '1以下' | '2' | '3' | '4' | '5' | '6'; // その日の障害支援区分
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecordFormData {
  residentId: string;
  date: string;
  isUsed: boolean;
  disabilityLevel: '1以下' | '2' | '3' | '4' | '5' | '6';
}

export interface MonthlyUsageSummary {
  residentId: string;
  totalDays: number;
  usageByLevel: {
    [key: string]: number; // 障害支援区分別の利用日数
  };
}