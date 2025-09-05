import React, { useState, useEffect } from 'react';
import { Calendar, Users, ChevronDown, ChevronRight, FileText, Home, CheckCircle } from 'lucide-react';
import { Resident } from '../types/Resident';
import { GroupHome, ExpansionRecord } from '../types/GroupHome';
import { UsageRecord, MonthlyUsageSummary } from '../types/UsageRecord';
import { useAuth } from '../hooks/useAuth';
import StatsCard from './StatsCard';

interface UsageRecordPageProps {
  residents: Resident[];
  groupHomes: GroupHome[];
  expansionRecords: ExpansionRecord[];
  usageRecords: UsageRecord[];
  onUsageRecordUpdate: (records: UsageRecord[]) => void;
}

const UsageRecordPage: React.FC<UsageRecordPageProps> = ({
  residents,
  groupHomes,
  expansionRecords,
  usageRecords,
  onUsageRecordUpdate
}) => {
  const { currentUser } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [localUsageRecords, setLocalUsageRecords] = useState<UsageRecord[]>(usageRecords);
  const [savingCells, setSavingCells] = useState<Set<string>>(new Set());
  const [savedCells, setSavedCells] = useState<Set<string>>(new Set());

  console.log("residents::::::", residents);
  console.log("groupHomes::::::", groupHomes);

  useEffect(() => {
    setLocalUsageRecords(usageRecords);
    console.log("usageRecords::::", usageRecords);
  }, [usageRecords]);

  // 障害支援区分の色を取得
  const getDisabilityLevelColor = (level: string) => {
    console.log("level::::", level);
    const colorMap: { [key: string]: string } = {
      '1以下': 'bg-blue-100 border-blue-200',
      '2': 'bg-green-100 border-green-200',
      '3': 'bg-yellow-100 border-yellow-200',
      '4': 'bg-orange-100 border-orange-200',
      '5': 'bg-red-100 border-red-200',
      '6': 'bg-purple-100 border-purple-200'
    };
    return colorMap[level] || 'bg-gray-100 border-gray-200';
  };

//  // 指定日の障害支援区分を取得
//  const getDisabilityLevelForDate = (resident: Resident, date: string): string => {
//    const targetDate = new Date(date);
//    
//    // 障害支援区分履歴から該当する区分を検索
//    const applicableHistory = resident.disabilityHistory
//      ?.find(history => {
//        const startDate = new Date(history.startDate);
//        const endDate = history.endDate ? new Date(history.endDate) : null;
//        
//        return startDate <= targetDate && (!endDate || targetDate <= endDate);
//      });
//    
//    return applicableHistory?.disabilityLevel || resident.disabilityLevel;
//  };

// その日（date）に有効な支援区分を返す
const getDisabilityLevelForDate = (resident: Resident, date: string): string => {
  console.log("DEBUG resident:", resident);
  console.log("DEBUG disabilityHistory:", resident.disabilityHistory);
  console.log("DEBUG date:", date);

  const target = new Date(date);
  const history = resident.disabilityHistory || [];

  for (const h of history) {
    console.log("CHECK history item:", h);
  }

  // histories を開始日昇順に
  const histories = (resident.disabilityHistory ?? []).slice().sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // 1) その日を「区間内」に含む履歴を探す
  const active = histories.find(h => {
    const s = new Date(h.startDate);
    const e = h.endDate && h.endDate !== '0000-00-00' ? new Date(h.endDate) : null; // 開放区間を許容
    return s <= target && (!e || target <= e);
  });
  if (active) return active.disabilityLevel;

  // 2) 区間内に無ければ「直前の履歴」（startDate <= target の最大）を使う
  const previous = [...histories].reverse().find(h => new Date(h.startDate) <= target);
  if (previous) return previous.disabilityLevel;

  // 3) それでも無ければ resident 側の最新をフォールバック
  return resident.disabilityLevel || '';
};


  // 指定月の日付配列を生成
  const getDaysInMonth = (year: number, month: number): string[] => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: string[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      days.push(date);
    }
    
    return days;
  };

  // 対象月に入居している利用者を取得
  const getActiveResidentsForMonth = (): Resident[] => {
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const monthEnd = new Date(selectedYear, selectedMonth, 0);
    
    return residents.filter(resident => {
      const moveInDate = resident.moveInDate ? new Date(resident.moveInDate) : null;
      const moveOutDate = resident.moveOutDate ? new Date(resident.moveOutDate) : null;
      
      // 入居日チェック：入居日が月末以前
      const isMovedIn = !moveInDate || moveInDate <= monthEnd;
      
      // 退居日チェック：退居日が月初以降
      const isNotMovedOut = !moveOutDate || moveOutDate >= monthStart;
      
      return isMovedIn && isNotMovedOut;
    });
  };

  // ユニット別にグループ化
  const getGroupedResidents = () => {
    const activeResidents = getActiveResidentsForMonth();
    const grouped = new Map<string, Resident[]>();
    
    activeResidents.forEach(resident => {
      console.log("resident:::::", resident);
      const key = `${resident.groupHomeName}-${resident.unitName}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(resident);
    });
    
    // 各グループ内で部屋番号順にソート
    grouped.forEach((residents, key) => {
      residents.sort((a, b) => {
        const aNum = parseInt((a.roomNumber ?? '').replace(/\D/g, ''), 10);
        const bNum = parseInt((b.roomNumber ?? '').replace(/\D/g, ''), 10);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        return (a.roomNumber ?? "").localeCompare(b.roomNumber ?? "");
      });
    });
    
    return Array.from(grouped.entries()).sort(([a], [b]) => (a ?? "").localeCompare(b ?? ""));
  };

// 日付に応じてレベルを取得
const getLevelForDate = (history: any[], date: string): string | undefined => {
  const targetDate = new Date(date);
  console.log("targetDate:", targetDate);

  for (const h of history) {
    const start = new Date(h.startDate);
    const end = h.endDate ? new Date(h.endDate) : null;

    console.log("start:", start);
    console.log("end:", end);

    if (targetDate >= start && (!end || targetDate <= end)) {
      return String(h.level); // levelをstringに
    }
  }

  return undefined;
};

const getUsageRecord = (residentId: string, date: string) => {
  const record = usageRecords.find(
    (r) => String(r.residentId) === String(residentId) && r.date === date
  );

  console.log("typeof residentId::", type residentId);
  console.log("typeof r.residentId::", typeof r.residentId);
  console.log("record::::", record);

  const resident = residents.find((r) => r.id === residentId);
  const level = resident
    ? getLevelForDate(resident.disabilityHistory, date)
    : undefined;

  if (record) {
    return {
      ...record,
      disabilityLevel: level,
    };
  }

  return {
    id: `usage_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    residentId,
    date,
    isUsed: false,
    disabilityLevel: level, // ←ここで履歴の値を使う！
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

//const getUsageRecord = (residentId: number, date: string) => {
//  return usageRecords.find(
//    record => record.residentId === residentId && record.date === date
//  ) || { isUsed: false, disabilityLevel: '' };
//};

  // 即時保存処理
  const updateUsageRecordInstantly = async (residentId: string, date: string, isUsed: boolean) => {
    console.log("updateUsageRecordInstantlyだよ！");
    const cellKey = `${residentId}-${date}`;
    
    // 保存中状態を設定
    setSavingCells(prev => new Set([...prev, cellKey]));
    
    try {
      const existingIndex = localUsageRecords.findIndex(
        record => record.residentId === residentId && record.date === date
      );
      
      const resident = residents.find(r => r.id === residentId);
      console.log("resident:::::::", resident);

      if (!resident) return;
      
      const disabilityLevel = getDisabilityLevelForDate(resident, date);
      console.log("disabilityLevel::::", disabilityLevel);
      
      let updatedRecords: UsageRecord[];
      
      if (existingIndex >= 0) {
        // 既存レコードを更新
        updatedRecords = [...localUsageRecords];
        updatedRecords[existingIndex] = {
          ...updatedRecords[existingIndex],
          isUsed,
          disabilityLevel,
          updatedAt: new Date().toISOString()
        };
      } else {
        // 新規レコードを追加
        const newRecord: UsageRecord = {
          id: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          residentId,
          date,
          isUsed,
          disabilityLevel,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedRecords = [...localUsageRecords, newRecord];
      }
      
      // ローカル状態を更新
      setLocalUsageRecords(updatedRecords);
      
      // サーバーに保存（模擬的な遅延を追加）
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 親コンポーネントに通知
      onUsageRecordUpdate(updatedRecords);
      
      // 保存成功のフィードバック
      setSavingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
      
      setSavedCells(prev => new Set([...prev, cellKey]));
      
      // 1秒後にハイライトを消去
      setTimeout(() => {
        setSavedCells(prev => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
      }, 1000);
      
    } catch (error) {
      console.error('保存エラー:', error);
      // エラー処理（必要に応じて）
      setSavingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  };

  // 月間利用実績サマリーを計算
  const getMonthlyUsageSummary = (residentId: string): MonthlyUsageSummary => {
    const days = getDaysInMonth(selectedYear, selectedMonth);
    const usageByLevel: { [key: string]: number } = {};
    let totalDays = 0;
    
    days.forEach(date => {
      console.log("date:", date);
      console.log("residentId:", residentId);
      const record = getUsageRecord(residentId, date);
      console.log("record:", record);
      if (record.isUsed) {
        totalDays++;
        const level = record.disabilityLevel;
        usageByLevel[level] = (usageByLevel[level] || 0) + 1;
      }
    });
    
    return {
      residentId,
      totalDays,
      usageByLevel
    };
  };

  // ユニットの展開/収納
  const toggleUnitExpansion = (unitKey: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitKey)) {
      newExpanded.delete(unitKey);
    } else {
      newExpanded.add(unitKey);
    }
    setExpandedUnits(newExpanded);
  };

  // 全ユニットを展開
  const expandAllUnits = () => {
    const allUnits = getGroupedResidents().map(([unitKey]) => unitKey);
    setExpandedUnits(new Set(allUnits));
  };

  // 全ユニットを収納
  const collapseAllUnits = () => {
    setExpandedUnits(new Set());
  };

  const days = getDaysInMonth(selectedYear, selectedMonth);
  const groupedResidents = getGroupedResidents();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 統計情報
  const totalActiveResidents = getActiveResidentsForMonth().length;
  const totalUsageDays = localUsageRecords
    .filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === selectedYear && 
             recordDate.getMonth() + 1 === selectedMonth && 
             record.isUsed;
    }).length;

  const getMonthName = (month: number) => {
    const months = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return months[month - 1];
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">ログインしてください</p>
        <p className="text-sm text-gray-400">
          利用実績記録機能を利用するにはログインが必要です
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">利用実績の記録</h2>
          <p className="text-gray-600 mt-1">
            月ごとの利用者の利用実績を記録・管理します（即時保存）
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700 font-medium">自動保存有効</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={<Calendar className="w-6 h-6" />}
          title={`${selectedYear}年${getMonthName(selectedMonth)}`}
          value={days.length}
          subtitle="日間"
          color="blue"
        />
        <StatsCard
          icon={<Users className="w-6 h-6" />}
          title="対象利用者"
          value={totalActiveResidents}
          subtitle="名"
          color="green"
        />
        <StatsCard
          icon={<FileText className="w-6 h-6" />}
          title="総利用日数"
          value={totalUsageDays}
          subtitle="日"
          color="orange"
        />
        <StatsCard
          icon={<Home className="w-6 h-6" />}
          title="対象ユニット"
          value={groupedResidents.length}
          subtitle="ユニット"
          color="purple"
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map(month => (
                  <option key={month} value={month}>{getMonthName(month)}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={expandAllUnits}
              className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              全て展開
            </button>
            <button
              onClick={collapseAllUnits}
              className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              全て収納
            </button>
          </div>
        </div>

        {/* 即時保存の説明 */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 mb-1">即時保存機能</h4>
              <p className="text-sm text-green-700">
                チェックボックスをクリックすると自動的に保存されます。保存完了時にセルが一瞬ハイライト表示されます。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Record Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedYear}年{getMonthName(selectedMonth)}の利用実績
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                ✅ = 利用あり、❌ = 利用なし（入院・外泊等）
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <span className="inline-flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-200 rounded animate-pulse"></div>
                <span>保存中</span>
              </span>
              <span className="inline-flex items-center space-x-2 ml-4">
                <div className="w-3 h-3 bg-green-400 rounded"></div>
                <span>保存完了</span>
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {groupedResidents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {selectedYear}年{getMonthName(selectedMonth)}に入居している利用者がいません
              </p>
              <p className="text-sm text-gray-400">
                対象月を変更するか、利用者の入居日を確認してください
              </p>
            </div>
          ) : (
            <div className="min-w-full">
              {groupedResidents.map(([unitKey, unitResidents]) => (
                <div key={unitKey} className="border-b border-gray-200">
                  {/* Unit Header */}
                  <div
                    className="bg-gray-50 px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleUnitExpansion(unitKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {expandedUnits.has(unitKey) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <Home className="w-5 h-5 text-gray-600" />
                        <h4 className="font-medium text-gray-800">{unitKey}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {unitResidents.length}名
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Unit Content */}
                  {expandedUnits.has(unitKey) && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200 min-w-[200px]">
                              利用者
                            </th>
                            {days.map(date => {
                              const day = new Date(date).getDate();
                              const dayOfWeek = new Date(date).getDay();
                              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                              return (
                                <th
                                  key={date}
                                  className={`px-2 py-3 text-center text-xs font-medium min-w-[40px] ${
                                    isWeekend ? 'text-red-600 bg-red-50' : 'text-gray-700'
                                  }`}
                                >
                                  {day}
                                </th>
                              );
                            })}
                            <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-l border-gray-200 min-w-[120px]">
                              利用日数
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {unitResidents.map(resident => {
                            const summary = getMonthlyUsageSummary(resident.id);
                            return (
                              <tr key={resident.id} className="border-t border-gray-100 hover:bg-gray-50">
                                <td className="sticky left-0 bg-white px-4 py-3 border-r border-gray-200">
                                  <div>
                                    <p className="font-medium text-gray-800 text-sm">{resident.name}</p>
                                    <p className="text-xs text-gray-500">{resident.roomNumber}</p>
                                  </div>
                                </td>
{days.map(date => {
  const record = getUsageRecord(resident.id, date);
  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // 🔍 追加: 日付が入退居範囲外か判定
  const moveInDate = resident.moveInDate ? new Date(resident.moveInDate) : null;
  const moveOutDate = resident.moveOutDate ? new Date(resident.moveOutDate) : null;
  const currentDate = new Date(date);
  const isOutOfRange =
    (moveInDate && currentDate < moveInDate) ||
    (moveOutDate && currentDate > moveOutDate);

  console.log("record::::::::", record);
  const cellColor = getDisabilityLevelColor(record.disabilityLevel);
  console.log("cellColor::", cellColor);
  const cellKey = `${resident.id}-${date}`;
  const isSaving = savingCells.has(cellKey);
  const isSaved = savedCells.has(cellKey);

  return (
    <td
      key={date}
      className={`px-2 py-3 text-center relative ${
        isWeekend ? 'bg-red-50' : ''
      } ${isOutOfRange ? 'bg-gray-200' : ''}`}
    >
      <button
        onClick={() =>
          !isOutOfRange &&
          updateUsageRecordInstantly(resident.id, date, !record.isUsed)
        }
        disabled={isSaving || isOutOfRange}
        className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold transition-all ${
          isOutOfRange
            ? 'cursor-not-allowed bg-gray-200 border-gray-300 text-gray-400'
            : record.isUsed
            ? `${cellColor} text-gray-700`
            : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200'
        } ${isSaving ? 'animate-pulse' : ''} ${
          isSaved ? 'ring-2 ring-green-400 bg-green-200' : ''
        }`}
        title={
          isOutOfRange
            ? 'この日は対象外です'
            : `${resident.name} - ${date} - 区分${record.disabilityLevel}`
        }
      >
        {isSaving ? (
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        ) : isOutOfRange ? (
          '-'
        ) : record.isUsed ? (
          '✓'
        ) : (
          '×'
        )}

        {isSaved && (
          <div className="absolute inset-0 bg-green-400 rounded opacity-30 animate-ping"></div>
        )}
      </button>
    </td>
  );
})}

                                <td className="px-4 py-3 text-center border-l border-gray-200">
                                  <div className="text-sm">
                                    <p className="font-bold text-gray-800">{summary.totalDays}日</p>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {Object.entries(summary.usageByLevel).map(([level, days]) => (
                                        <div key={level} className="flex items-center justify-center space-x-1">
                                          <span className={`inline-block w-2 h-2 rounded-full ${getDisabilityLevelColor(level).replace('bg-', 'bg-').replace('-100', '-400')}`}></span>
                                          <span>区分{level}: {days}日</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-medium text-gray-800 mb-4">障害支援区分別の色分け</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {['1以下', '2', '3', '4', '5', '6'].map(level => (
            <div key={level} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded border-2 ${getDisabilityLevelColor(level)}`}></div>
              <span className="text-sm text-gray-700">区分{level}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-600 space-y-1">
          <p>💡 各セルの色は、その日の利用者の障害支援区分に基づいて自動的に設定されます</p>
          <p>💡 障害支援区分が月の途中で変更された場合、変更日から新しい区分の色で表示されます</p>
          <p>🔄 チェックボックスをクリックすると即座に保存され、保存完了時にセルが緑色にハイライトされます</p>
        </div>
      </div>
    </div>
  );
};

export default UsageRecordPage;
