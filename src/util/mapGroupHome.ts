// src/util/mapGroupHome.ts
export function mapGroupHome(groupHome: any) {
  return {
    id: groupHome.id,
    propertyName: groupHome.property_name ?? "",
    unitName: groupHome.unit_name ?? "",
    postalCode: groupHome.postal_code ?? "",
    address: groupHome.address ?? "",
    phoneNumber: groupHome.phone_number ?? "",
    commonRoom: groupHome.common_room ?? "",
    residentRooms: groupHome.resident_rooms ?? [], // ✅ これが重要！
    openingDate: groupHome.opening_date ?? "",
    createdAt: groupHome.created_at ?? "",
  };
}

