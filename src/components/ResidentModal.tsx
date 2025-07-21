import React, { useEffect, useState } from "react";
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

const isEditMode = !!editResident;

const ResidentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSubmit,
  editResident,
  groupHomes,
  expansionRecords,
}) => {
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

  const selectedUnit = () => allUnits().find((u) => u.id === formData.groupHomeId);

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
  if (!isOpen) return;

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

    const mappedResident = mapResident(residentFromAPI);
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
      roomNumber: mappedResident.roomNumber || "",
      moveInDate: formatDate(mappedResident.admissionDate),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

console.log("✅ フォームデータ:", formData);
console.log("✅ バリデーションエラー:", errors);

    const u = selectedUnit();
    if (!u) {
      console.error("unit が取得できませんでした");
      return;
    }

    const now = new Date().toISOString();
// handleSubmit の中でこうする！
const finalDisabilityHistory =
  disabilityHistory.length > 0
    ? disabilityHistory
    : editResident?.disabilityHistory ?? []; // ← null fallback!!

const currentLevel =
  finalDisabilityHistory?.find?.((h) => !h.endDate)?.disabilityLevel || formData.disabilityLevel;

    const resident: Resident = {
      id: editResident?.id ?? undefined,  // ← ここだけ直せばOK
      name: formData.name.trim(),
      nameKana: formData.nameKana.trim(),
      gender: formData.gender,
      birthdate: formData.birthdate,
      disabilityLevel: currentLevel,
      disabilityHistory: finalDisabilityHistory, 
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
      createdAt: editResident?.createdAt || now,
      updatedAt: now,
    };

    console.log("➡️ ResidentModal から onSubmit 呼出", resident);
    onSubmit(resident);
    onClose();
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

{/* 障害情報 */}
<section className="bg-purple-50 rounded-lg p-4 border border-purple-200 space-y-5">
  <h3 className="font-medium text-purple-800 flex items-center">
    <User className="w-5 h-5 mr-2" />
    障害情報
  </h3>
  <div className="grid md:grid-cols-2 gap-5">
    <div>
<select
  value={formData.disabilityLevel}
  onChange={(e) =>
    setFormData((p) => ({ ...p, disabilityLevel: e.target.value }))
  }
  className="w-full rounded-lg border px-4 py-2 border-gray-300"
  disabled={isEditMode} // ? 編集時は変更できないように
>
  {["1以下", "2", "3", "4", "5", "6"].map((level) => (
    <option key={level} value={level}>
      支援区分 {level}
    </option>
  ))}
</select>
    </div>
    <div>
{input("disabilityStartDate", {
  type: "date",
  placeholder: "開始日 *",
  readOnly: isEditMode, // ? 編集時は手入力不可
})}
      {errors.disabilityStartDate && (
        <p className="text-xs text-red-500 mt-1">{errors.disabilityStartDate}</p>
      )}
    </div>
    <div className="md:col-span-2 text-right">
      <button
        type="button"
        onClick={() => setIsDisModalOpen(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        障害歴を編集する
      </button>
    </div>
  </div>
</section>

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
          disabilityHistory={disabilityHistory}
          setDisabilityHistory={setDisabilityHistory}
        />
      </div>
    </div>
  );
};

export default ResidentModal;

