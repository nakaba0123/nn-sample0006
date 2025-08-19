// 先頭 import はほぼそのまま
import React, { useEffect, useState } from "react";
import { X, Users, User, Home, Calendar, Shield, Plus, History } from 'lucide-react';
import { mapResident } from '../util/mapResident';
import { Resident, ResidentFormData, DisabilityHistory } from "../types/Resident";
import { GroupHome, ExpansionRecord } from "../types/GroupHome";
import DisabilityHistoryModal from "./DisabilityHistoryModal";
import DisabilityHistoryCard from './DisabilityHistoryCard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Resident) => void;
  editResident?: Resident | null;
  groupHomes: GroupHome[];
  expansionRecords: ExpansionRecord[];
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0];
}

const ResidentModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, editResident, groupHomes, expansionRecords }) => {
  const isEditMode = !!editResident;

  const [formData, setFormData] = useState<ResidentFormData>({
    name: "",
    nameKana: "",
    gender: "",
    birthdate: "",
    disabilityLevel: "1以下",
    disabilityStartDate: "",
    groupHomeId: "",
    groupHomeName: "",
    unitName: "",
    roomNumber: "",
    moveInDate: "",
    moveOutDate: "",
  });

  const [disabilityHistory, setDisabilityHistory] = useState<DisabilityHistory[]>([]);
  const [editingDisabilityHistory, setEditingDisabilityHistory] = useState<DisabilityHistory | null>(null);
  const [isDisabilityHistoryModalOpen, setIsDisabilityHistoryModalOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<ResidentFormData>>({});

  const isHiragana = (t: string) => /^[\u3041-\u3096\u30FC\s　]+$/.test(t.trim());

  // =========================
  // ユニット・部屋関連ユーティリティ
  // =========================
  const allUnits = () => {
    const map = new Map<string, { id: string; propertyName: string; unitName: string }>();
    groupHomes.forEach((g) =>
      map.set(`${g.propertyName}-${g.unitName}`, { id: String(g.id), propertyName: g.propertyName, unitName: g.unitName })
    );
    expansionRecords.filter(e => e.expansionType === "A").forEach((e) => {
      const key = `${e.propertyName}-${e.unitName}`;
      if (!map.has(key)) map.set(key, { id: `expansion_${e.id}`, propertyName: e.propertyName, unitName: e.unitName });
    });
    return [...map.values()].sort((a, b) =>
      a.propertyName === b.propertyName ? a.unitName.localeCompare(b.unitName) : a.propertyName.localeCompare(b.propertyName)
    );
  };

  const selectedUnit = () => allUnits().find(u => u.id === formData.groupHomeId);

  const availableRooms = () => {
    const sel = selectedUnit();
    if (!sel) return [];
    const set = new Set<string>();
    groupHomes.filter(g => g.propertyName === sel.propertyName && g.unitName === sel.unitName)
      .forEach(g => g.residentRooms.forEach(r => set.add(r)));
    expansionRecords.filter(e => e.propertyName === sel.propertyName && e.unitName === sel.unitName)
      .forEach(e => e.newRooms.forEach(r => set.add(r)));
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };

  // =========================
  // モーダル open 時に初期化 / 編集データ取得
  // =========================
  useEffect(() => {
    if (!isOpen) return;

    if (!editResident) {
      // 新規
      setFormData({
        name: "",
        nameKana: "",
        gender: "",
        birthdate: "",
        disabilityLevel: "1以下",
        disabilityStartDate: "",
        groupHomeId: "",
        groupHomeName: "",
        unitName: "",
        roomNumber: "",
        moveInDate: "",
        moveOutDate: "",
      });
      setDisabilityHistory([]);
      setErrors({});
      return;
    }

    // 編集モード：resident + history fetch
    const fetchResidentAndHistories = async () => {
      try {
        const [residentRes, historyRes] = await Promise.all([
          fetch(`/api/residents/${editResident.id}`, { headers: { "Cache-Control": "no-cache" } }),
          fetch(`/api/disability_histories?resident_id=${editResident.id}`, { headers: { "Cache-Control": "no-cache" } }),
        ]);
        if (!residentRes.ok || !historyRes.ok) throw new Error("データ取得失敗");

        const residentFromAPI = await residentRes.json();
        const history = await historyRes.json();

        const mappedResident = mapResident(residentFromAPI);
        const currentDis = history.find((h:any) => !h.end_date)?.disability_level || mappedResident.disabilityLevel;

        setFormData({
          name: mappedResident.name,
          nameKana: mappedResident.nameKana,
          gender: mappedResident.gender || "",
          birthdate: formatDate(mappedResident.birthdate),
          disabilityLevel: currentDis,
          disabilityStartDate: formatDate(history[0]?.start_date || mappedResident.disabilityStartDate),
          groupHomeId: String(mappedResident.groupHomeId || ""),
          groupHomeName: mappedResident.groupHomeName || "",
          unitName: mappedResident.unitName || "",
          roomNumber: mappedResident.roomNumber || "",
          moveInDate: formatDate(mappedResident.moveInDate),
          moveOutDate: formatDate(mappedResident.dischargeDate),
        });

        setDisabilityHistory(history);
      } catch (err) {
        console.error(err);
        setDisabilityHistory([]);
      }
    };
    fetchResidentAndHistories();
  }, [isOpen, editResident]);

  // =========================
  // 障害履歴モーダル制御
  // =========================
  const handleAddDisabilityHistory = () => {
    setEditingDisabilityHistory(null);
    setIsDisabilityHistoryModalOpen(true);
  };

  const handleEditDisabilityHistory = (history: DisabilityHistory) => {
    setEditingDisabilityHistory(history);
    setIsDisabilityHistoryModalOpen(true);
  };

  const handleDeleteDisabilityHistory = (historyId: string) => {
    if (!window.confirm("この障害支援区分履歴を削除しますか？")) return;
    setDisabilityHistory(prev => prev.filter(h => h.id !== historyId));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentDisabilityLevel = () => formData?.disabilityLevel || "未設定";

  // =========================
  // JSX 描画
  // =========================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー省略 */}
        {/* 基本情報・障害支援区分・入居情報 セクション省略 */}
        {/* ここに以前の JSX をそのまま置く */}

        {/* 障害履歴モーダル */}
        {isDisabilityHistoryModalOpen && (
          <DisabilityHistoryModal
            isOpen={isDisabilityHistoryModalOpen}
            residentId={editResident?.id ?? 0}
            editHistory={editingDisabilityHistory}
            existingHistory={disabilityHistory}
            onClose={() => setIsDisabilityHistoryModalOpen(false)}
            onSubmit={(historyData) => {
              const isEdit = !!editingDisabilityHistory?.id;
              if (isEdit) {
                setDisabilityHistory(prev =>
                  prev.map(h => h.id === editingDisabilityHistory.id ? {
                    ...h,
                    start_date: historyData.startDate,
                    end_date: historyData.endDate,
                    disability_level: historyData.disabilityLevel
                  } : h)
                );
              } else {
                setDisabilityHistory(prev => [...prev, {
                  id: Date.now(), // 仮 ID
                  start_date: historyData.startDate,
                  end_date: historyData.endDate,
                  disability_level: historyData.disabilityLevel
                }]);
              }
              setIsDisabilityHistoryModalOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ResidentModal;

