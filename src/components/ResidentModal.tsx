import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GroupHome {
  id: number;
  propertyName: string;
  unitName: string;
  residentRooms: string[];
}

interface ExpansionRecord {
  id: number;
  propertyName: string;
  unitName: string;
  expansionType: "A" | "B";
  newRooms: string[];
}

interface ResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => void;
  formData: any;
  setFormData: (data: any) => void;
  groupHomes: GroupHome[];
  expansionRecords: ExpansionRecord[];
}

const ResidentModal: React.FC<ResidentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  groupHomes,
  expansionRecords,
}) => {
  // --- allUnits: propertyName + unitName 単位でまとめる ---
  const allUnits = useMemo(() => {
    const map = new Map<string, { id: string; propertyName: string; unitName: string }>();

    // 既存グループホーム
    groupHomes.forEach((g) => {
      map.set(`${g.propertyName}-${g.unitName}`, {
        id: String(g.id),
        propertyName: g.propertyName,
        unitName: g.unitName,
      });
    });

    // 増床
    expansionRecords.forEach((e) => {
      const key = `${e.propertyName}-${e.unitName}`;
      if (e.expansionType === "A") {
        // 単純増床: 同じユニット扱い → 既存に合算するので新規登録不要
        if (!map.has(key)) {
          map.set(key, {
            id: `expansion_${e.id}`,
            propertyName: e.propertyName,
            unitName: e.unitName,
          });
        }
      } else if (e.expansionType === "B") {
        // 別ユニット: 強制的に別扱い
        map.set(`expansion_${e.id}`, {
          id: `expansion_${e.id}`,
          propertyName: e.propertyName,
          unitName: e.unitName,
        });
      }
    });

    return [...map.values()].sort((a, b) =>
      a.propertyName === b.propertyName
        ? a.unitName.localeCompare(b.unitName)
        : a.propertyName.localeCompare(b.propertyName)
    );
  }, [groupHomes, expansionRecords]);

  // --- 選択中ユニット ---
  const selectedUnit = useMemo(
    () => allUnits.find((u) => u.id === formData.groupHomeId),
    [allUnits, formData.groupHomeId]
  );

  // --- availableRooms: GH + Expansion の合算 ---
  const availableRooms = useMemo(() => {
    const sel = selectedUnit;
    if (!sel) return [];
    const set = new Set<string>();

    // GHから
    groupHomes
      .filter((g) => g.propertyName === sel.propertyName && g.unitName === sel.unitName)
      .forEach((g) => g.residentRooms.forEach((r) => set.add(r)));

    // Expansionから
    expansionRecords
      .filter((e) => e.propertyName === sel.propertyName && e.unitName === sel.unitName)
      .forEach((e) => e.newRooms.forEach((r) => set.add(r)));

    return [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [selectedUnit, groupHomes, expansionRecords]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>利用者登録</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>氏名</Label>
            <Input
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label>入居先グループホーム</Label>
            <Select
              value={formData.groupHomeId || ""}
              onValueChange={(v) => setFormData({ ...formData, groupHomeId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {allUnits.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.propertyName} - {u.unitName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>部屋番号</Label>
            <Select
              value={formData.roomNumber || ""}
              onValueChange={(v) => setFormData({ ...formData, roomNumber: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onSave(formData)}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResidentModal;

