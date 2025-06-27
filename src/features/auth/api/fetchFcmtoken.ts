import api from "@/@shared/api/api"

import { FcmTokenUpdateInput, FcmTokenRemoveInput, FcmTokenResponse } from "../types/fcmType";

export const fetchFcmtokenRemove = async ({memberId}: FcmTokenRemoveInput): Promise<FcmTokenResponse> => {
    const response = await api.patch(
        `/api/notifications/fcm-token/remove?memberId=${memberId}`);
    return { status: response.status, data: response.data };
};

export const fetchFcmtokenUpdate = async ({ memberId, token }: FcmTokenUpdateInput): Promise<FcmTokenResponse> => {
    if (!token) {
        throw new Error('Token is required');
    }
    // 수정된 부분: 요청 본문에서 memberId 제거, token만 보냄
    const response = await api.patch(`/api/notifications/fcm-token?memberId=${memberId}`, { token });
    return { status: response.status, data: response.data };
};