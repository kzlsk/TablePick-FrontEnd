// import api from "@/@shared/api/api";
// import { NotificationTypes } from "@/features/notification/types/notification";
// import { fetchFcmtokenUpdate } from "@/features/auth/api/fetchFcmtoken";
// import { getSavedFCMToken } from "@/features/notification/lib/firebase";
// import { useState, useEffect } from "react";

// let notificationTypeMap: Record<NotificationTypes, number> = {} as Record<NotificationTypes, number>;
// let notificationDetails: Record<NotificationTypes, { title: string; body: string; url: string }> = {} as Record<NotificationTypes, { title: string; body: string; url: string }>;

// export const initializeNotificationTypeMap = async () => {
//   try {
//     console.log('알림 타입 조회 요청');
//     const response = await api.get('/api/notifications/notification-types');
//     const types = response.data;
//     if (!Array.isArray(types)) {
//       console.error('알림 타입 응답이 배열이 아님:', types);
//       throw new Error('서버 응답이 예상된 배열 형식이 아닙니다.');
//     }
//     notificationTypeMap = types.reduce((map: { [key: string]: number }, type: { id: number; type: string }) => {
//       map[type.type] = type.id;
//       return map;
//     }, {});
//     console.log('알림 타입 초기화 성공:', notificationTypeMap);
//   } catch (error: any) {
//     if (error.response?.status === 401) {
//       console.error('인증 오류: 로그인 필요', error.response?.data || error.message);
//       throw new Error('인증되지 않은 요청입니다. 로그인이 필요합니다.');
//     }
//     if (error.response?.status === 404) {
//       console.error('알림 타입 엔드포인트 not found:', error.response?.data || error.message);
//       throw new Error('알림 타입 엔드포인트를 찾을 수 없습니다.');
//     }
//     if (typeof error.response?.data === 'string' && error.response.data.startsWith('<!DOCTYPE html>')) {
//       console.error('인증 오류: 로그인 페이지 HTML 응답 수신:', error.response.data.substring(0, 50));
//       throw new Error('인증되지 않은 요청입니다. 로그인이 필요합니다.');
//     }
//     console.error('알림 타입 조회 오류:', error.message, error);
//     throw error;
//   }
// };

// export const getNotificationTypeMap = () => notificationTypeMap;

// export const useNotificationTypeMapInitializer = () => {
//   const [initialized, setInitialized] = useState(false);

//   useEffect(() => {
//     if (!initialized) {
//       initializeNotificationTypeMap()
//         .then(() => {
//           console.log('알림 타입 초기화 완료:', notificationTypeMap, notificationDetails);
//           setInitialized(true);
//         })
//         .catch((error) => {
//           console.error('알림 타입 맵 초기화 실패:', error);
//         });
//     }
//   }, [initialized]);

//   return initialized;
// };

// export const fetchNotificationSchedule = async (
//   notificationType: NotificationTypes,
//   memberId: number,
//   extraData?: { reservationId?: number; restaurantName?: string }
// ) => {
//   if (!notificationTypeMap[notificationType]) {
//     console.warn('notificationTypeMap이 초기화되지 않음, 재시도');
//     await initializeNotificationTypeMap();
//     if (!notificationTypeMap[notificationType]) {
//       throw new Error('알림 타입 초기화 실패');
//     }
//   }

//   const fcmToken = getSavedFCMToken();
//   if (!fcmToken) {
//     console.error('FCM 토큰 없음');
//     throw new Error('FCM 토큰 없음');
//   }

//   try {
//     await fetchFcmtokenUpdate({ memberId, token: fcmToken });
//     console.log('FCM 토큰 등록 성공');
//   } catch (error) {
//     console.error('FCM 토큰 등록 실패:', error);
//     throw error;
//   }

//   const payload = {
//     memberId,
//     notificationTypeId: notificationTypeMap[notificationType],
//     reservationId: extraData?.reservationId,
//     scheduledAt: new Date().toISOString(),
//   };

//   console.log('알림 스케줄링 페이로드:', JSON.stringify(payload, null, 2));

//   try {
//     const response = await api.post(`/api/notifications/schedule`, payload);
//     console.log(`${notificationType} 알림 스케줄링 성공:`, response.data);
//     return response.data;
//   } catch (error) {
//     console.error(`${notificationType} 알림 스케줄링 실패:`, error);
//     throw error;
//   }
// };

// export const fetchNotificationScheduleReservation = async (reservationId: number, restaurantName?: string) => {
//   const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
//   const memberId = userInfo?.id;
//   if (!memberId) {
//     console.error('session storage에서 memberId를 찾을 수 없음');
//     throw new Error('memberId 없음');
//   }

//   return fetchNotificationSchedule('RESERVATION_COMPLETED', memberId, { reservationId, restaurantName });
// };

// export const fetchMemberNotification = async (memberId: number, status?: string) => {
//   const url = status
//     ? `/api/notifications/member/${memberId}?status=${status}`
//     : `/api/notifications/member/${memberId}`;

//   const response = await api.get(url);
//   return { status: response.status, data: response.data };
// };

// export const fetchNotificationTypes = async () => {
//   try {
//     const response = await api.get('/api/notifications/notification-types');
//     console.log('fetchNotificationTypes 원본 응답:', response);
//     return { status: response.status, data: response.data };
//   } catch (error) {
//     console.error('fetchNotificationTypes 호출 오류:', error);
//     throw error;
//   }
// };
