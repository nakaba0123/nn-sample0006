// utils/mapExpansion.ts
export const mapExpansion = (expansion: any) => ({
  id: expansion.id,
  propertyName: expansion.propertyName,
  unitName: expansion.unitName,
  startDate: expansion.startDate,
  expansionType: expansion.expansionType,
  newRooms: expansion.newRooms,
  commonRoom: expansion.commonRoom,
  createdAt: expansion.createdAt,
});

// src/util/mapExpansion.ts
export const mapExpansionResponse = (data: any) => ({
  id: data.id,
  groupHomeId: data.group_home_id,
  propertyName: data.property_name,
  unitName: data.unit_name,
  expansionType: data.expansion_type,
  newRooms: JSON.parse(data.new_rooms || '[]'),
  commonRoom: data.common_room,
  startDate: data.start_date,
  endDate: data.end_date,
  createdAt: data.created_at,
});

