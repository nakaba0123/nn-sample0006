// util/mapGroupHome.ts
export const mapGroupHome = (gh: any) => {
  console.log("💡 transforming group home:", gh);
  return {
    id: gh.id,
    propertyName: gh.property_name,
    unitName: gh.unit_name,
    postalCode: gh.postal_code,
    address: gh.address,
    phoneNumber: gh.phone_number,
    commonRoom: gh.common_room,
    openingDate: gh.opening_date,
    createdAt: gh.created_at,
    facilityCode: gh.facility_code,
    residentRooms: gh.resident_rooms,
    expansions: gh.expansions,
  };
};

