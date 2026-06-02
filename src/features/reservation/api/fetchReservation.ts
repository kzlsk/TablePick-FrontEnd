import { supabase } from "@/@shared/types/supabase";
import {
  ReservationRequest,
  ReservationResponse,
  ReservationData,
} from "../types/reservationType";

// 예약 내역 목록 조회
export const fetchMemberReservation = async (
  memberId: number,
): Promise<ReservationData[]> => {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      `
    id,
    reservation_date,
    reservation_time,
    reservation_status,
    party_size,
    created_at,
    restaurants (id, name, address, restaurant_image)  
    `,
    )
    .eq("member_id", memberId)
    .order("reservation_date", { ascending: false })
    .order("reservation_time", { ascending: false });

  if (error) {
    console.error("예약 내역 로드 실패 : ", error);
    return [];
  }
  return (data || []).map((res: any) => {
    const restaurantObj = Array.isArray(res.restaurants)
      ? res.restaurants[0]
      : res.restaurants;

    return {
      id: res.id,
      reservationDate: res.reservation_date,
      reservationTime: res.reservation_time?.substring(0, 5) || "",
      reservationStatus: res.reservation_status,
      partySize: Number(res.party_size) || 1,
      created_at: res.created_at,
      restaurantId: restaurantObj?.id || 0,
      restaurantName: restaurantObj?.name || "알 수 없는 식당",
      restaurantAddress: restaurantObj?.address || "정보 없음",
      restaurantImage: restaurantObj?.restaurant_image || null,
    };
  });
};

// 예약 등록
export const fetchReservation = async (
  reservatiaonData: ReservationRequest,
  memberId: number,
): Promise<ReservationResponse> => {
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      member_id: memberId,
      restaurant_id: reservatiaonData.restaurantId,
      reservation_date: reservatiaonData.reservationDate,
      reservation_time:
        reservatiaonData.reservationTime.length === 5
          ? `${reservatiaonData.reservationTime}:00`
          : reservatiaonData.reservationTime,
      reservation_status: "PENDING",
    })
    .select()
    .single();

  if (error) {
    console.error("예약 등록 실패 : ", error);
    throw error;
  }

  const reservationId = data.id;
  if (!reservationId) {
    throw new Error("예약 아이디 생성 실패");
  }

  return {
    reservationId,
    ...data,
    reservationDate: data.reservation_date,
    reservationTime: data.reservation_time?.substring(0, 5) || "",
  };
};

// 예약 취소
export const fetchReservationDelete = async (reservationId: number) => {
  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", reservationId);

  if (error) {
    console.error("예약 취소 실패 : ", error);
    throw error;
  }
};

// 예약 가능 시간 목록 조회
export const fetchAvailableReservationTimes = async (
  date: Date,
  restaurantId: number,
): Promise<string[]> => {
  if (!date || !restaurantId) return [];

  const formattedDate = date
    .toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })
    .replace(/\//g, "-");

  const { data: existingReservations, error } = await supabase
    .from("reservations")
    .select("reservation_time")
    .eq("restaurant_id", restaurantId)
    .eq("reservation_date", formattedDate)
    .neq("reservation_status", "CANCELLED");

  if (error) {
    console.error("예약 가능 시간 조회 실패 : ", error);
    return [];
  }

  const ALL_TIME_SLOTS = [
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  const reservedTimes = (existingReservations || []).map((res: any) =>
    res.reservation_time ? res.reservation_time.substring(0, 5) : "",
  );

  return ALL_TIME_SLOTS.filter((time) => !reservedTimes.includes(time));
};
