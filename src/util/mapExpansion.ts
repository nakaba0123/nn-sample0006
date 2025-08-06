// utils/mapExpansion.ts
export const mapExpansion = (expansion: any) => ({
  id: expansion.id,
  propertyName: expansion.property_name,
  unitName: expansion.unit_name,
  startDate: expansion.start_date,
  expansionType: expansion.expansion_type,
  newRooms: expansion.new_rooms,
  commonRoom: expansion.common_room,
  createdAt: expansion.created_at,
});

