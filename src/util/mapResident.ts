// utils/mapResident.ts

export function mapResident(resident: any) {
  return {
    id: resident.id,
    groupHomeId: resident.groupHomeId ?? "",
    name: resident.name ?? "",
    nameKana: resident.nameKana ?? "",
    gender: resident.gender ?? "",
    birthdate: resident.birthdate ?? "",
    disabilityLevel: resident.disabilityLevel ?? "",
    disabilityStartDate: resident.disabilityStartDate ?? "",
    roomNumber: resident.roomNumber ?? "",
    moveInDate: resident.moveInDate ?? "",
    moveOutDate: resident.moveOutDate ?? "",
    memo: resident.memo ?? "",
  };
}

