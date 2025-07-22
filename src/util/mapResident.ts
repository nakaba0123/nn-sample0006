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
    moveInDate: resident.admission_date ?? "",
    moveOutDate: resident.discharge_date ?? "",
    memo: resident.memo ?? "",
  };
}

