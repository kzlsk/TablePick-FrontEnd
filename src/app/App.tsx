import '@/app/App.css'
import PageRouter from '@/app/pageRouter'
import AuthHeader from '../@shared/components/Header/AuthHeader'
import UnAuthHeader from '../@shared/components/Header/UnAuthHeader'
import useAuth from '@/features/auth/hook/useAuth'
import { initializeFirebaseAppAndMessaging, getFCMToken, saveFCMToken, setupNotificationListener } from '@/features/notification/lib/firebase'
import { useEffect, useState } from 'react'
import { useFcmtokenUpdate } from '@/features/auth/hook/mutations/useFcmtokenUpdate';
import { useFcmTokenRemoveMutation } from '@/features/auth/hook/mutations/useFcmtokenRemoveMutation'

export default function App() {
  const [userId, setUserId] = useState<number | null>(null);
 
  const updateFcmToken = useFcmtokenUpdate();
  const deleteFcmToken = useFcmTokenRemoveMutation();
  useEffect(() => {
    // ✅ 여기에서 userId를 sessionStorage에서 가져와 상태로 설정
    const storedUserInfoString = sessionStorage.getItem('userInfo');
    if (storedUserInfoString) {
      try {
        const storedUserInfo = JSON.parse(storedUserInfoString);
        if (storedUserInfo && typeof storedUserInfo.id === 'number') {
          setUserId(storedUserInfo.id); 
        } else {
          console.warn('userInfo에서 유효한 id를 찾을 수 없습니다.');
          setUserId(null); 
        }
      } catch (e) {
        console.error('userInfo를 파싱하는 데 실패했습니다:', e);
        setUserId(null);
      }
    } else {
      setUserId(null); 
    }


    const setupFCM = async () => {
      console.log('FCM 설정 시작...');

      if (userId === null) {
        console.warn('사용자 ID를 찾을 수 없어 FCM 초기화를 건너뜜. 로그인 상태를 확인해주세요.');
        return; 
      }

      const messaging = await initializeFirebaseAppAndMessaging();

      if (messaging) {
        console.log('Firebase Messaging 초기화 성공.');
        const token = await getFCMToken(messaging);
        if (token) {
        console.log('FCM 토큰 발급 완료:', token);
        try {
        await saveFCMToken(userId, token, updateFcmToken.mutateAsync);
        console.log('FCM 토큰 서버 저장 성공.');
        } catch (error) {
        console.error('FCM 토큰 서버 저장 실패:', error);
        }
      } else {
        console.warn('FCM 토큰을 가져오지 못했습니다. 알림 권한을 확인해주세요.');
      }

      setupNotificationListener(messaging, (payload) => {
        console.log('App.tsx에서 포그라운드 메시지 수신:', payload);
      });

      } else {
        console.error('Firebase Messaging 초기화에 실패하여 알림 기능을 사용할 수 없습니다.');
      }
    };
    setupFCM();
  }, [userId, updateFcmToken.mutateAsync, deleteFcmToken.mutateAsync]);

  const { isAuthenticated } = useAuth();
  
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