import '@/app/App.css'
import PageRouter from '@/app/pageRouter'
import AuthHeader from '../@shared/components/Header/AuthHeader'
import UnAuthHeader from '../@shared/components/Header/UnAuthHeader'
import useAuth from '@/features/auth/hook/useAuth'
import { initializeFirebaseAppAndMessaging, getFCMToken, saveFCMToken, setupNotificationListener } from '@/features/notification/lib/firebase'
import { useEffect, useState } from 'react'
import { useFcmtokenUpdate } from '@/features/auth/hook/mutations/useFcmtokenUpdate';

export default function App() {
  const { user, isAuthenticated } = useAuth();
  const { mutateAsync: updateFcmtoken } = useFcmtokenUpdate();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [fcmInitializationAttempted, setFcmInitializationAttempted] = useState(false); // 새로운 상태 추가

  const setupFCM = async () => {
    if (!isAuthenticated) {
      console.log('비로그인 상태: FCM 초기화 건너뜀');
      return;
    }
    console.log('FCM 설정 시작...');
    setFcmInitializationAttempted(true); // FCM 초기화를 시도했음을 표시

    try {
      const messaging = await initializeFirebaseAppAndMessaging();
      if (!messaging) {
        console.error('FCM 초기화 실패: Messaging 인스턴스 생성 실패');
        return;
      }

      console.log('FCM 초기화 성공');

      // FCM 토큰 가져오기
      const token = await getFCMToken(messaging);
      if (!token) {
        console.error('FCM 토큰 가져오기 실패');
        return;
      }

      setFcmToken(token);
      console.log('FCM 토큰 생성 완료:', token);

      // 사용자 정보가 있으면 즉시 토큰 저장 시도
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const memberId = (typeof user?.id === 'number' && user.id > 0) ? user.id :
                     (typeof userInfo?.id === 'number' && userInfo.id > 0) ? userInfo.id : null;

      if (memberId && token) { // memberId와 token이 모두 있을 때만 저장 시도
        await saveFCMToken(memberId, token, updateFcmtoken);
        console.log('FCM 토큰 저장 완료 (초기 시도):', { memberId });
      } else {
        console.warn('사용자 ID 또는 FCM 토큰 없음: 토큰 저장 건너뜀. 로그인/토큰 발급 후 재시도 예정.');
      }

      // 알림 리스너 설정
      setupNotificationListener(messaging, (payload) => {
        console.log('App.tsx에서 포그라운드 메시지 수신:', payload);
      });
    } catch (error) {
      console.error('FCM 설정 오류:', error);
    }
  };

  useEffect(() => {
    // 컴포넌트 마운트 시 한 번만 FCM 설정을 시도
    if (isAuthenticated&&!fcmInitializationAttempted) { // 컴포넌트가 다시 렌더링될 때 여러 번 호출되는 것을 방지
      setupFCM();
    }
  }, [isAuthenticated, fcmInitializationAttempted]); // 의존성 배열에서 user.id 제거

  // user.id 또는 sessionStorage.userInfo.id 변경 시 토큰 저장 재시도
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('비로그인 상태: FCM 토큰 저장 건너뜀');
      return;
    }

    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
    const memberId = typeof user?.id === 'number' && user.id > 0 ? user.id :
                    typeof userInfo?.id === 'number' && userInfo.id > 0 ? userInfo.id : null

    // fcmToken과 memberId가 모두 있을 때만 저장 시도
    if (fcmToken && memberId) {
      saveFCMToken(memberId, fcmToken, updateFcmtoken)
        .then(() => console.log('FCM 토큰 저장 완료 (재시도):', { memberId }))
        .catch((error) => console.error('FCM 토큰 저장 실패 (재시도):', error));
    } else {
      console.log('FCM 토큰 저장 재시도 건너뜀: FCM 토큰 또는 memberId 없음', { fcmToken, memberId });
    }
  }, [user?.id, fcmToken, updateFcmtoken, isAuthenticated]); // fcmInitializationAttempted를 의존성에서 제거

  return (
    <div className="relative w-full min-h-screen flex justify-center bg-white">
      {/* 실제 콘텐츠 영역 */}
      <div className="relative min-h-screen w-full bg-white">
        {isAuthenticated ? <AuthHeader /> : <UnAuthHeader />}
        <PageRouter />
      </div>
    </div>
  )
}