import React, { useState, useEffect } from "react";
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

interface ResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Resident) => void;
  editResident?: Resident | null;
  groupHomes: GroupHome[];
  expansionRecords: ExpansionRecord[];
}

const ResidentModal: React.FC<ResidentModalProps> = ({
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

  useEffect(() => {
    if (!isOpen) return;
    if (editResident) {
      const currentDis =
        editResident.disabilityHistory.find((h) => !h.endDate)?.disabilityLevel ||
        editResident.disabilityLevel;
      setFormData({
        name: editResident.name,
        nameKana: editResident.nameKana,
        gender: editResident.gender ?? "",
        birthdate: editResident.birthdate ?? "",
        disabilityLevel: currentDis,
        disabilityStartDate: editResident.disabilityHistory[0]?.startDate || "",
        groupHomeId: editResident.groupHomeId,
        roomNumber: editResident.roomNumber,
        moveInDate: editResident.moveInDate || "",
        moveOutDate: editResident.moveOutDate || "",
      });
      setDisabilityHistory(editResident.disabilityHistory);
    } else {
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
      setDisabilityHistory([]);
    }
  }, [isOpen, editResident]);

  const isHiragana = (t: string) => /^[\u3041-\u3096\u30FC\s　]+$/.test(t.trim());


const allUnits = (): { id: string; propertyName: string; unitName: string }[] => {
  const map = new Map<string, { id: string; propertyName: string; unitName: string }>();
  groupHomes.forEach((g) =>
    map.set(`${g.propertyName}-${g.unitName}`, {
      id: String(g.id), // ←ここで強制的に文字列にする！
      propertyName: g.propertyName,
      unitName: g.unitName,
    })
  );
    expansionRecords
      .filter((e) => e.expansionType === "A")
      .forEach((e) => {
        const key = `${e.propertyName}-${e.unitName}`;
        if (!map.has(key))
          map.set(key, { id: `expansion_${e.id}`, propertyName: e.propertyName, unitName: e.unitName });
      });
    return [...map.values()].sort((a, b) =>
      a.propertyName === b.propertyName ? a.unitName.localeCompare(b.unitName) : a.propertyName.localeCompare(b.propertyName)
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
    return [...set].sort();
  };

  const validate = () => {
    const next: Partial<ResidentFormData> = {};
    if (!formData.name.trim()) next.name = "利用者名を入力してください";
    if (!formData.nameKana.trim()) next.nameKana = "よみがなを入力してください";
    else if (!isHiragana(formData.nameKana)) next.nameKana = "ひらがなで入力してください";
    if (!formData.gender) next.gender = "性別を選択してください";
    if (!formData.birthdate) next.birthdate = "生年月日を入力してください";
    if (!formData.moveInDate) next.moveInDate = "入居日を入力してください";
    if (!formData.groupHomeId) next.groupHomeId = "グループホームを選択してください";
    if (!formData.roomNumber) next.roomNumber = "部屋番号を選択してください";
    if (!editResident && !formData.disabilityStartDate) next.disabilityStartDate = "開始日を入力してください";
    if (formData.moveOutDate && formData.moveOutDate <= formData.moveInDate) next.moveOutDate = "退居日は入居日より後に";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {

console.log("formData:", formData);
console.log("selectedUnit:", selectedUnit());


    e.preventDefault();
    console.log("submit clicked");

    const isValid = validate();
    console.log("🧪 validateの結果:", isValid);

    if (!isValid) {
      console.log("⛔ バリデーション失敗。送信中止！");
      return;
    }

    if (!unit) return;

    const now = new Date().toISOString();
    const currentLevel =
      disabilityHistory.find((h) => !h.endDate)?.disabilityLevel || formData.disabilityLevel;

    const resident: Resident = {
      id: editResident?.id || `resident_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: formData.name.trim(),
      nameKana: formData.nameKana.trim(),
      gender: formData.gender,
      birthdate: formData.birthdate,
      disabilityLevel: currentLevel,
      disabilityHistory,
      groupHomeId: formData.groupHomeId,
      groupHomeName: unit.propertyName,
      unitName: unit.unitName,
      roomNumber: formData.roomNumber,
      moveInDate: formData.moveInDate,
      moveOutDate: formData.moveOutDate || undefined,
      status: !formData.moveOutDate ? "active" : new Date(formData.moveOutDate) <= new Date() ? "inactive" : "active",
      createdAt: editResident?.createdAt || now,
      updatedAt: now,
    };

    console.log("➡️ onSubmitを呼ぶぞ！");

    onSubmit(resident);
    if (!editResident) {
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
      setDisabilityHistory([]);
    }
    onClose();
  };

  const handleInputChange = (key: keyof ResidentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const input = (key: keyof ResidentFormData, props = {}) => (
    <input
      {...props}
      value={(formData[key] as string) || ""}
      onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
      className={`w-full rounded-lg border px-4 py-2 ${
        errors[key] ? "border-red-400 bg-red-50" : "border-gray-300"
      }`}
    />
  );

  if (!isOpen) return null;

// 👇👇👇 ここに console.log を入れます
console.log("groupHomeId:", formData.groupHomeId);
console.log("selectedUnit:", selectedUnit());
console.log("availableRooms:", availableRooms());

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
              <User className="w-5 h-5 mr-2" /> 基本情報
            </h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div>{input("name")}{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}</div>
              <div>{input("nameKana")}{errors.nameKana && <p className="text-xs text-red-500 mt-1">{errors.nameKana}</p>}</div>
              <div>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className={`w-full rounded-lg border px-4 py-2 ${
                    errors.gender ? "border-red-400 bg-red-50" : "border-gray-300"
                  }`}
                >
                  <option value="">性別 *</option>
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                  <option value="その他">その他</option>
                </select>
                {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
              </div>
              <div>{input("birthdate", { type: "date" })}{errors.birthdate && <p className="text-xs text-red-500 mt-1">{errors.birthdate}</p>}</div>
            </div>
          </section>

          <section className="bg-green-50 rounded-lg p-4 border border-green-200 space-y-5">
            <h3 className="font-medium text-green-800 flex items-center">
              <Home className="w-5 h-5 mr-2" /> 入居先情報
            </h3>
            <div>
              <select
                value={formData.groupHomeId}
                onChange={(e) => setFormData((p) => ({ ...p, groupHomeId: e.target.value, roomNumber: "" }))}
                className={`w-full rounded-lg border px-4 py-2 ${
                  errors.groupHomeId ? "border-red-400 bg-red-50" : "border-gray-300"
                }`}
              >
                <option value="">グループホーム *</option>
                {allUnits().map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.propertyName} - {u.unitName}
                  </option>
                ))}
              </select>
              {errors.groupHomeId && <p className="text-xs text-red-500 mt-1">{errors.groupHomeId}</p>}
            </div>
            <div>
              <select
                value={formData.roomNumber}
                onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                disabled={!formData.groupHomeId}
                className={`w-full rounded-lg border px-4 py-2 ${
                  errors.roomNumber ? "border-red-400 bg-red-50" : "border-gray-300"
                }`}
              >
                <option value="">{formData.groupHomeId ? "部屋番号 *" : "まずグループホームを選択"}</option>
                {availableRooms().map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.roomNumber && <p className="text-xs text-red-500 mt-1">{errors.roomNumber}</p>}
            </div>
          </section>

          <section className="bg-orange-50 rounded-lg p-4 border border-orange-200 space-y-4">
            <h3 className="flex items-center font-medium text-orange-800">
              <Calendar className="w-5 h-5 mr-2" /> 入退居日
            </h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div>{input("moveInDate", { type: "date" })}{errors.moveInDate && <p className="text-xs text-red-500 mt-1">{errors.moveInDate}</p>}</div>
              <div>{input("moveOutDate", { type: "date" })}{errors.moveOutDate && <p className="text-xs text-red-500 mt-1">{errors.moveOutDate}</p>}</div>
            </div>
          </section>

          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="flex-1 border px-4 py-3 rounded-lg hover:bg-gray-50">キャンセル</button>
            <button type="submit" className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700">
              {editResident ? "更新" : "登録"}
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

