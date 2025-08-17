import React, { useEffect, useState } from "react";
import { X, User, Users, Home, Calendar, Shield, MapPin, Hash, Plus, History } from 'lucide-react';
import { mapResident } from '../util/mapResident';
import {
  X,
  User,
  Users,
  Home,
  Calendar,
} from "lucide-react";
import {
  Resident,
  ResidentFormData,
  DisabilityHistory,
} from "../types/Resident";
import { GroupHome, ExpansionRecord } from "../types/GroupHome";
import DisabilityHistoryModal from "./DisabilityHistoryModal";
import DisabilityHistoryCard from './DisabilityHistoryCard'; // ←★これを追加

/**
 * ResidentModal – 2025‑07 最終安定版
 * ---------------------------------------------------------
 * ● フィールド必須化            : gender / birthdate / moveInDate / disabilityStartDate
 * ● groupHome/room 連動の安定化 : id を常に **string** で比較し POST 時に number へ変換
 * ● unit の参照漏れ撲滅         : JSX 内は selected へ束縛、スコープ外参照ゼロ
 * ● onSubmit 直前に構築した resident を完全ログ      
 */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Resident) => void;
  editResident?: Resident | null;
  groupHomes: GroupHome[];
  expansionRecords: ExpansionRecord[];
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0]; // "yyyy-MM-dd"形式に変換
}


const ResidentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  editResident,
  groupHomes,
  expansionRecords,
}) => {
  const isEditMode = !!editResident;
  const [formData, setFormData] = useState<ResidentFormData>({
    name: "",
    nameKana: "",
    gender: "",
    birthdate: "",
    disabilityLevel: "1以下",
    disabilityStartDate: "",
    groupHomeId: "",
    roomNumber: "",
    moveInDate: "",
    moveOutDate: "",
  });
  const [disabilityHistory, setDisabilityHistory] = useState<DisabilityHistory[]>([]);
  const [isDisModalOpen, setIsDisModalOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<ResidentFormData>>({});

  const isHiragana = (t: string) => /^[\u3041-\u3096\u30FC\s　]+$/.test(t.trim());

  const [isDisabilityHistoryModalOpen, setIsDisabilityHistoryModalOpen] = useState(false);
  const [editingDisabilityHistory, setEditingDisabilityHistory] = useState<DisabilityHistory | null>(null);

  console.log("ResidentModal 描画中");
  console.log("disabilityHistory:", disabilityHistory);
  console.log("length:", disabilityHistory?.length);
  console.log("formData:", formData);

  // 現在の障害支援区分を取得
  const getCurrentDisabilityLevel = () => {
//    console.log("disabilityHistory::::", disabilityHistory);
//    const currentHistory = disabilityHistory.find(h => !h.endDate);
//    console.log("currentHistory::::", currentHistory);
//    return currentHistory?.disability_level || '未設定';
    return formData?.disabilityLevel || '未設定';
  };

const handleDisabilityHistorySubmit = async (data: DisabilityHistoryFormData) => {
  try {
    // camelCase → snake_case に変換
    const payload = {
      resident_id: data.residentId,
      disability_level: data.disabilityLevel,
      start_date: data.startDate,
      end_date: data.endDate,
    };

    if (editingDisabilityHistory) {
      // 更新
      const res = await fetch(`/api/disability_histories/${editingDisabilityHistory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('更新に失敗しました');
    } else {
      // 追加
      const res = await fetch('/api/disability_histories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('追加に失敗しました');
    }

    // 成功したら最新履歴を再取得
    const historyRes = await fetch(`/api/disability_histories?resident_id=${editResident?.id}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!historyRes.ok) throw new Error('履歴の再取得に失敗しました');
    const updatedHistory = await historyRes.json();

    setDisabilityHistory(updatedHistory);
    setIsDisabilityHistoryModalOpen(false);
    setEditingDisabilityHistory(null);
  } catch (error: any) {
    alert(error.message);
  }
};


  const handleEditDisabilityHistory = (history: DisabilityHistory) => {
    setEditingDisabilityHistory(history);
    setIsDisModalOpen(true);
  };

  const handleDeleteDisabilityHistory = (historyId: string) => {
    if (window.confirm('この障害支援区分履歴を削除してもよろしいですか？')) {
      setDisabilityHistory(prev => prev.filter(h => h.id !== historyId));
    }
  };

  const handleAddDisabilityHistory = () => {
    setEditingDisabilityHistory(null);
    setIsDisModalOpen(true);
  };

  const handleCloseDisabilityHistoryModal = () => {
    setIsDisabilityHistoryModalOpen(false);
    setEditingDisabilityHistory(null);
  };

  const allUnits = () => {
    const map = new Map<string, { id: string; propertyName: string; unitName: string }>();
    groupHomes.forEach((g) =>
      map.set(`${g.propertyName}-${g.unitName}`, {
        id: String(g.id),
        propertyName: g.propertyName,
        unitName: g.unitName,
      })
    );
    expansionRecords
      .filter((e) => e.expansionType === "A")
      .forEach((e) => {
        const key = `${e.propertyName}-${e.unitName}`;
        if (!map.has(key))
          map.set(key, {
            id: `expansion_${e.id}`,
            propertyName: e.propertyName,
            unitName: e.unitName,
          });
      });
    return [...map.values()].sort((a, b) =>
      a.propertyName === b.propertyName
        ? a.unitName.localeCompare(b.unitName)
        : a.propertyName.localeCompare(b.propertyName)
    );
  };

  const selectedUnit = () => allUnits()?.find((u) => u.id === formData.groupHomeId);

  const availableRooms = () => {
    const sel = selectedUnit();
    if (!sel) return [];
    const set = new Set<string>();
    groupHomes
      .filter((g) => g.propertyName === sel.propertyName && g.unitName === sel.unitName)
      .forEach((g) => g.residentRooms.forEach((r) => set.add(r)));
    expansionRecords
      .filter((e) => e.propertyName === sel.propertyName && e.unitName === sel.unitName)
      .forEach((e) => e.newRooms.forEach((r) => set.add(r)));
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };

useEffect(() => {
  console.log("ResidentModal入ったよ");
  if (!isOpen) return;
  console.log("オープンだよ！");

  if (!editResident) {
    // 🟩 新規モードの場合は formData を初期化する
    setFormData({
      name: "",
      nameKana: "",
      gender: "",
      birthdate: "",
      disabilityLevel: "1以下",
      disabilityStartDate: "",
      groupHomeId: "",
      groupHomeName: "",   // ← ★追加
      unitName: "",             // ← ★追加
      roomNumber: "",
      moveInDate: "",
      moveOutDate: "",
    });
    setDisabilityHistory([]); // 初期化
    setErrors({});
    return;
  }


  // 🟦 編集モード時の処理
const fetchResidentAndHistories = async () => {
  try {
    const [residentRes, historyRes] = await Promise.all([
      fetch(`/api/residents/${editResident.id}`, {
        headers: { "Cache-Control": "no-cache" },
      }),
      fetch(`/api/disability_histories?resident_id=${editResident.id}`, {
        headers: { "Cache-Control": "no-cache" },
      }),
    ]);

    if (!residentRes.ok || !historyRes.ok) {
      throw new Error("データの取得に失敗しました");
    }

    const residentFromAPI = await residentRes.json();
    const history = await historyRes.json();

console.log("residentFromAPI", residentFromAPI);
console.log("history", history);

    const mappedResident = mapResident(residentFromAPI);

console.log("mappedResident", mappedResident);

    const currentDis =
      history.find((h: any) => !h.end_date)?.disability_level || mappedResident.disabilityLevel;

    setFormData({
      name: mappedResident.name,
      nameKana: mappedResident.nameKana,
      gender: mappedResident.gender || "",
      birthdate: formatDate(mappedResident.birthdate),
      disabilityLevel: currentDis,
      disabilityStartDate: formatDate(history[0]?.start_date || mappedResident.disabilityStartDate),
      groupHomeId: String(mappedResident.groupHomeId || ""),
      groupHomeName: mappedResident.groupHomeName || "",   // ← ★追加
      unitName: mappedResident.unitName || "",             // ← ★追加
      roomNumber: mappedResident.roomNumber || "",
      moveInDate: formatDate(mappedResident.moveInDate),
      moveOutDate: formatDate(mappedResident.dischargeDate),
    });

    setDisabilityHistory(history);
  } catch (err) {
    console.error("データ取得失敗:", err);
    setDisabilityHistory([]);
  }
};
  fetchResidentAndHistories();
}, [isOpen, editResident]);

  const validate = () => {
    const next: Partial<ResidentFormData> = {};
    if (!formData.name.trim()) next.name = "利用者名を入力してください";
    if (!formData.nameKana.trim()) next.nameKana = "よみがなを入力してください";
    else if (!isHiragana(formData.nameKana)) next.nameKana = "ひらがなで入力してください";
    if (!formData.gender) next.gender = "性別を選択してください";
    if (!formData.birthdate) next.birthdate = "生年月日を入力してください";
    if (!formData.moveInDate) next.moveInDate = "入居日を入力してください";
    if (!formData.disabilityStartDate) next.disabilityStartDate = "開始日を入力してください";
    if (!formData.groupHomeId) next.groupHomeId = "グループホームを選択してください";
    if (!formData.roomNumber) next.roomNumber = "部屋番号を選択してください";
    if (formData.moveOutDate && formData.moveOutDate <= formData.moveInDate)
      next.moveOutDate = "退居日は入居日より後に";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  console.log("? フォームデータ:", formData);
  console.log("? バリデーションエラー:", errors);

  const u = selectedUnit();
  console.log("💡 selectedUnit の値:", u); // ← これ追加
  if (!u) {
    console.error("unit が取得できませんでした");
    return;
  }

  const now = new Date().toISOString();

const finalDisabilityHistory =
  Array.isArray(disabilityHistory) && disabilityHistory.length > 0
    ? disabilityHistory
    : Array.isArray(editResident?.disabilityHistory)
      ? editResident.disabilityHistory
      : [];

  const currentLevel =
    finalDisabilityHistory?.find?.((h) => !h.endDate)?.disabilityLevel || formData.disabilityLevel;

const resident: Omit<Resident, "id"> = {
  name: formData.name.trim(),
  nameKana: formData.nameKana.trim(),
  gender: formData.gender,
  birthdate: formData.birthdate,
  disabilityLevel: currentLevel,
  disabilityHistory: [
    {
      id: 0, // 仮ID（サーバー側で無視 or 自動採番される）
      residentId: 0, // 同上
      disabilityLevel: formData.disabilityLevel,
      startDate: formData.disabilityStartDate,
      endDate: "0000-00-00", // または null
      createdAt: now,
      updatedAt: now,
    },
  ],
  groupHomeId: Number(formData.groupHomeId),
  groupHomeName: u.propertyName,
  unitName: u.unitName,
  roomNumber: formData.roomNumber,
  moveInDate: formData.moveInDate,
  moveOutDate: formData.moveOutDate || undefined,
  status: !formData.moveOutDate
    ? "active"
    : new Date(formData.moveOutDate) <= new Date()
    ? "inactive"
    : "active",
  createdAt: now,
  updatedAt: now,
};

  let residentId: number | null = editResident?.id ?? null;
  const isEdit = !!residentId;


const residentPayload = {
  name: resident.name,
  name_kana: resident.nameKana,
  gender: resident.gender,
  birthdate: resident.birthdate,
  group_home_id: resident.groupHomeId,
  group_home_name: resident.groupHomeName,
  unit_name: resident.unitName,
  room_number: resident.roomNumber,
  move_in_date: resident.moveInDate,
  move_out_date: resident.moveOutDate || null,
  status: resident.status, // ← これを追加！
  created_at: resident.createdAt,
  updated_at: resident.updatedAt,
};

if (!isEdit) {
  residentPayload.disability_level = resident.disabilityLevel;
  residentPayload.disability_start_date = formData.disabilityStartDate || null;
}

try {
  console.log("🔥 登録直前データ（residentPayload）:", residentPayload);

  // ★編集時のIDは editResident?.id を使う（resident は Omit なので id を持っていない）

  // ★編集は PATCH / 新規は POST
  const res = await fetch(isEdit ? `/api/residents/${residentId}` : '/api/residents', {
    method: isEdit ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(residentPayload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`利用者${isEdit ? '更新' : '登録'}に失敗しました: ${res.status} ${text}`);
  }

  // 新規時のみサーバーから返されたIDを採用
  const result = await res.json().catch(() => ({}));
  if (!residentId) residentId = result.id;
  if (!residentId) throw new Error('residentId を取得できませんでした');

  console.log("✅ 利用者保存成功:", residentId);

  // --- 障害履歴の保存（既存はPATCH / 新規はPOST, サーバーはスネークケース想定）---
  for (const h of finalDisabilityHistory) {
    const hasId = !!h.id;
    const historyPayload = {
      resident_id: residentId,
      disability_level: h.disabilityLevel ?? h.disability_level,
      start_date: h.startDate ?? h.start_date,
      end_date: (h.endDate ?? h.end_date) || null,
    };

    console.log("historyPayload:", historyPayload);

    // 既存は PATCH /:id、新規は POST /
    const historyUrl = hasId
      ? `/api/disability_histories/${h.id}`
      : `/api/disability_histories`;
    const historyMethod = hasId ? 'PATCH' : 'POST';

    let historyRes = await fetch(historyUrl, {
      method: historyMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(historyPayload),
    });

    // サーバー側でPATCHが未実装（404）の場合は新規作成にフォールバック
    if (!historyRes.ok && hasId && historyRes.status === 404) {
      historyRes = await fetch('/api/disability_histories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyPayload),
      });
    }

    if (!historyRes.ok) {
      const t = await historyRes.text().catch(() => "");
      console.warn("⚠️ 障害履歴登録/更新に失敗:", h, t);
    } else {
      console.log("🆗 障害履歴 保存OK:", hasId ? `id=${h.id}` : '(new)');
    }
  }

  onClose();

  const latestHistory = [...finalDisabilityHistory].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )[0];

  onSubmit({
    ...resident,
    id: residentId,
    disabilityLevel: latestHistory?.disabilityLevel ?? resident.disabilityLevel,
    disabilityHistory: finalDisabilityHistory,
  });

} catch (err) {
  console.error("? 登録失敗:", err);
  alert("登録に失敗しました");
}

};

  const input = (key: keyof ResidentFormData, props = {}) => (
    <input
      {...props}
      value={(formData[key] as string) || ""}
      onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
      className={`w-full rounded-lg border px-4 py-2 ${errors[key] ? "border-red-400 bg-red-50" : "border-gray-300"}`}
    />
  );

if (!isOpen) {
  console.log("🧪 ResidentModal レンダリング中");
  console.log("🧪 isOpen:", isOpen);
  return null; // ✅ selected はここでは呼ばない
}

const selected = selectedUnit(); // ✅ isOpen が true になってから呼ぶ
console.log("🧪 selectedUnit:", selected);
console.log("formData: ", formData);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold">
              {editResident ? "利用者情報編集" : "新規利用者登録"}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
  <section className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-5">
    <h3 className="font-medium text-blue-800 flex items-center">
      <User className="w-5 h-5 mr-2" />
      基本情報
    </h3>
    <div className="grid md:grid-cols-2 gap-5">
      <div>
        {input("name", { placeholder: "氏名 *" })}
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>
      <div>
        {input("nameKana", { placeholder: "よみがな *" })}
        {errors.nameKana && <p className="text-xs text-red-500 mt-1">{errors.nameKana}</p>}
      </div>
      <div>
        <select
          value={formData.gender}
          onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
          className={`w-full rounded-lg border px-4 py-2 ${
            errors.gender ? "border-red-400 bg-red-50" : "border-gray-300"
          }`}
        >
          <option value="">性別を選択 *</option>
          <option value="男性">男性</option>
          <option value="女性">女性</option>
          <option value="その他">その他</option>
        </select>
        {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
      </div>
      <div>
        {input("birthdate", { type: "date", placeholder: "生年月日 *" })}
        {errors.birthdate && <p className="text-xs text-red-500 mt-1">{errors.birthdate}</p>}
      </div>
    </div>
  </section>

            {/* 障害支援区分設定 */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-purple-800">障害支援区分</h3>
                  {editResident && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      現在: 区分{getCurrentDisabilityLevel()}
                    </span>
                  )}
                </div>
                {editResident && (
                  <button
                    type="button"
                    onClick={handleAddDisabilityHistory}
                    className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>履歴追加</span>
                  </button>
                )}
              </div>

            {!editResident ? (
                // 新規登録時：初期区分設定
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      初期障害支援区分 *
                    </label>
                    <select
                      value={formData.disabilityLevel}
                      onChange={(e) => handleInputChange('disabilityLevel', e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      <option value="1以下">1以下</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      適用開始日 *
                    </label>
      <input
        type="date"
        value={formData.disabilityStartDate}
        onChange={(e) => handleInputChange('disabilityStartDate', e.target.value)}
  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
    errors.disabilityStartDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
  }`}
/>

                    {errors.disabilityStartDate && <p className="text-red-500 text-sm mt-1">{errors.disabilityStartDate}</p>}
                  </div>
                </div>
              ) : (
                // 編集時：履歴表示
                <div>
                  {console.log("disabilityHistory", disabilityHistory)}
                  {disabilityHistory?.length === 0 ? (
                    <div className="text-center py-8">
                      <History className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">障害支援区分履歴がありません</p>
                      <p className="text-gray-400 text-xs">「履歴追加」ボタンから追加してください</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{disabilityHistory &&
  disabilityHistory
    .filter((history) => {
      console.log("フィルター前:", history); // ←①
      return history.start_date; // ←修正：startDate → start_date
    })
    .sort((a, b) => {
      console.log("ソート対象:", a.start_date, b.start_date); // ←修正：startDate → start_date
      return Date.parse(b.start_date) - Date.parse(a.start_date); // ←修正
    })
    .map((history) => {
      console.log("描画するカード:", history); // ←③
      return (
        <DisabilityHistoryCard
          key={history.id}
          history={{
            ...history,
            startDate: history.start_date,
            endDate: history.end_date,
            disabilityLevel: history.disability_level,
          }} // ←ここでキャメルに変換して渡すと親切
          onEdit={handleEditDisabilityHistory}
          onDelete={handleDeleteDisabilityHistory}
        />
      );
    })}
                    </div>
                  )}

                </div>
              )}
            </div>

{/* 入居情報 */}
<section className="bg-green-50 rounded-lg p-4 border border-green-200 space-y-5">
  <h3 className="font-medium text-green-800 flex items-center">
    <Home className="w-5 h-5 mr-2" />
    入居情報
  </h3>
  <div className="grid md:grid-cols-2 gap-5">
    <div>
<select
  value={formData.groupHomeId}
  onChange={(e) =>
    setFormData((p) => ({
      ...p,
      groupHomeId: e.target.value, // ✅ ここ！stringのまま
      roomNumber: "",
    }))
  }
  className={`w-full rounded-lg border px-4 py-2 ${
    errors.groupHomeId ? "border-red-400 bg-red-50" : "border-gray-300"
  }`}
>
  <option value="">物件・ユニットを選択 *</option>
  {allUnits().map((unit) => (
    <option key={unit.id} value={unit.id}>
      {unit.propertyName}／{unit.unitName}
    </option>
  ))}
</select>

      {errors.groupHomeId && <p className="text-xs text-red-500 mt-1">{errors.groupHomeId}</p>}
    </div>
    <div>
      <select
        value={formData.roomNumber}
        onChange={(e) => setFormData((p) => ({ ...p, roomNumber: e.target.value }))}
        className={`w-full rounded-lg border px-4 py-2 ${errors.roomNumber ? "border-red-400 bg-red-50" : "border-gray-300"}`}
      >
        <option value="">部屋番号を選択 *</option>
        {availableRooms().map((room) => (
          <option key={room} value={room}>
            {room}
          </option>
        ))}
      </select>
      {errors.roomNumber && <p className="text-xs text-red-500 mt-1">{errors.roomNumber}</p>}
    </div>
    <div>
      {input("moveInDate", { type: "date", placeholder: "入居日 *" })}
      {errors.moveInDate && <p className="text-xs text-red-500 mt-1">{errors.moveInDate}</p>}
    </div>
    <div>
      {input("moveOutDate", { type: "date", placeholder: "退居日（任意）" })}
      {errors.moveOutDate && <p className="text-xs text-red-500 mt-1">{errors.moveOutDate}</p>}
    </div>
  </div>
</section>

  <div className="flex justify-end space-x-3 pt-4 border-t">
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
    >
      キャンセル
    </button>
    <button
      type="submit"
      className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
    >
      登録
    </button>
  </div>
</form>
<DisabilityHistoryModal
  isOpen={isDisModalOpen}
  onClose={() => setIsDisModalOpen(false)}
  residentId={editResident?.id ?? 0} // ← 編集時はeditResident.id、新規時は仮の0
  editHistory={editingDisabilityHistory}
  existingHistory={disabilityHistory}
onSubmit={async (historyData) => {
  const isEdit = !!editingDisabilityHistory?.id; // try の外で定義
  try {
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit
      ? `/api/disability_histories/${editingDisabilityHistory.id}`
      : `/api/disability_histories`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(historyData)
    });

    if (!response.ok) {
      throw new Error('サーバー通信に失敗しました');
    }

    const result = await response.json();

//    if (isEdit) {
//      // 更新モード
//      setDisabilityHistory(prev =>
//        prev.map(h => h.id === editingDisabilityHistory.id
//          ? { ...historyData, id: editingDisabilityHistory.id }
//          : h
//        )
//      );
//    } else {
//      // 追加モード
//      setDisabilityHistory(prev => [...prev, { ...historyData, id: result.id }]);
//    }

if (isEdit) {
  setDisabilityHistory(prev =>
    prev.map(h =>
      h.id === editingDisabilityHistory.id
        ? {
            ...h,
            start_date: historyData.startDate,
            end_date: historyData.endDate,
            disability_level: historyData.disabilityLevel
          }
        : h
    )
  );
} else {
  setDisabilityHistory(prev => [
    ...prev,
    {
      id: result.id,
      start_date: historyData.startDate,
      end_date: historyData.endDate,
      disability_level: historyData.disabilityLevel
    }
  ]);
}

    console.log(`? ${isEdit ? '更新' : '追加'}成功:`, result);
    setIsDisModalOpen(false);

  } catch (error) {
    console.error(`? ${isEdit ? '更新' : '追加'}失敗:`, error);
    alert(`障害履歴の${isEdit ? '更新' : '登録'}に失敗しました`);
  }
}}

>
  {/* 子要素がある場合ここに書く */}
{isDisabilityHistoryModalOpen && (
  <DisabilityHistoryModal
    isOpen={isDisModalOpen}
    residentId={editResident?.id ?? 0} // ← これに差し替え
    history={editingDisabilityHistory}
    onClose={() => setIsDisabilityHistoryModalOpen(false)}
  />
)}

</DisabilityHistoryModal>
      </div>
    </div>
  );
};

export default ResidentModal;

