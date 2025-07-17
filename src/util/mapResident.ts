// utils/mapResident.ts

export function mapResident(apiData: any) {
  return {
    id: apiData.id,
    groupHomeId: apiData.group_home_id,
    name: apiData.name,
    nameKana: apiData.name_kana,
    gender: apiData.gender ?? "",
    birthdate: apiData.birthdate ?? "",
    disabilityLevel: apiData.disability_level ?? "",
    disabilityStartDate: apiData.disability_start_date ?? "",
    roomNumber: apiData.room_number ?? "",
    admissionDate: apiData.admission_date ?? "",
    dischargeDate: apiData.discharge_date ?? "",
    memo: apiData.memo ?? "",
  };
}

