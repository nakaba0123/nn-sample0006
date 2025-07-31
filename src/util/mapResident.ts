// utils/mapResident.ts

export function mapResident(resident: any) {
  return {
    id: resident.id,
    groupHomeId: resident.group_home_id ?? "",
    name: resident.name ?? "",
    nameKana: resident.name_kana ?? "",
    gender: resident.gender ?? "",
    birthdate: resident.birthdate ?? "",
    disabilityLevel: resident.disability_level ?? "",
    disabilityStartDate: resident.disability_start_date ?? "",
    roomNumber: resident.room_number ?? "",
    moveInDate: resident.move_in_date ?? "", // ← 修正！
    moveOutDate: resident.move_out_date ?? "", // ← 修正！
    memo: resident.memo ?? "",

    // ✅ 追加！
    groupHomeName: resident.group_home_name ?? "",
    unitName: resident.unit_name ?? "",
  };
}

