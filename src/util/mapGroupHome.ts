// util/mapGroupHome.ts
export const mapGroupHome = (gh: any) => ({
  console.log("💡 transforming group home:", gh);
  id: gh.id,
  propertyName: gh.property_name,
  unitName: gh.unit_name,
  postalCode: gh.postal_code,
  address: gh.address,
  phoneNumber: gh.phone_number,
  commonRoom: gh.common_room,
  residentRooms: gh.resident_rooms,
  openingDate: gh.opening_date,
  createdAt: gh.created_at,
});

