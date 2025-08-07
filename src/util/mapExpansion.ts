// utils/mapExpansion.ts
export const mapExpansion = (expansion: any) => ({
  id: expansion.id,
  propertyName: expansion.property_name,
  unitName: expansion.unit_name,
  startDate: expansion.start_date,
  expansionType: expansion.expansion_type,
  newRooms: JSON.parse(expansion.new_rooms || "[]")
  commonRoom: expansion.common_room,
  createdAt: expansion.created_at,
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

