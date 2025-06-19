import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import useModal from '@/@shared/hook/useModal';
import ReservationModal from '@/pages/restaurants/components/ReservationModal';
import LoginModal from '@/@shared/components/Modal/LoginModal';
import useAuth from '@/features/auth/hook/useAuth';

import defaultImg from '@/@shared/images/logo.png';

import { fetchRestaurantDetail } from '@/entities/restaurants/api/fetchRestaurants';
import { fetchRestaurantPost } from '@/entities/post/api/fetchPosts';
import { loadKakaoMapScript } from '@/entities/restaurants/util/loadKakaomap';

type RestaurantData = {
  id: number;
  name: string;
  address: string;
  restaurantPhoneNumber: string;
  restaurantCategory: { id: number; name: string };
  restaurantImage: { imageUrl: string };
  restaurantOperatingHours: {
    dayOfWeek: string;
    openTime: string | null;
    closeTime: string | null;
    holiday: boolean;
  }[];
  restaurantTags: string[];
  menus: { name: string; price: number }[];
  xcoordinate: number;
  ycoordinate: number;
};

type RestaurantReviewPost = {
  boardId: number;
  imageUrl: string;
};

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<RestaurantData | null>(null);
  const [reviewPosts, setReviewPosts] = useState<RestaurantReviewPost[]>([]);

  const {
    isOpen: isReservationOpen,
    openModal: openReservationModal,
    closeModal: closeReservationModal,
  } = useModal({ initialState: false });
  const {
    isOpen: isLoginOpen,
    openModal: openLoginModal,
    closeModal: closeLoginModal,
  } = useModal({ initialState: false });

  const { isAuthenticated } = useAuth();

  // 지도 DOM 요소에 접근하기 위한 Ref 생성
  // useRef를 사용하여 React에게 map이라는 이름표를 만들고 이 이름표를 JSX의 div 요소에 ref={mapRef}와 같이 붙여주면
  // 실제 브라우저의 DOM 요소를 가리키게 됨 => 카카오맵 라이브러리는 가상 DOM이 아닌 실제 DOM 요소에 지도를 그려야 하므로 ref를 통한 직접적인 접근이 필수적임
  const mapRef = useRef<HTMLDivElement>(null);

  // 생성된 지도 인스턴스를 저장하기 위한 Ref
  const mapInstance = useRef<kakao.maps.Map | null>(null); // kakao.maps.Map 인스턴스 보관

  // 지도의 로딩 상태와 에러 상태 관리 state
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // data가 변경될 때마다 지도를 새로 그리는 useEffect
  useEffect(() => {
    // mapRef.current가 아직 준비되지 않았으면 함수 종료
    if (!mapRef.current) {
      return;
    }

    // 지도에 표시할 데이터가 없으면 함수 종료
    if (!data) {
      return;
    }

    // 생성된 지도 인스턴스를 담을 임시 변수
    let map : kakao.maps.Map | null = null;

    // 비동기적으로 카카오맵 스크립트 로드, 성공하면 지도 생성
    loadKakaoMapScript()
      .then(() => {
        // 좌표와 장소 이름 추출
        const { xcoordinate: lng, ycoordinate: lat } = data;

        // 좌표 유효성 검사
        if (isNaN(lat) || isNaN(lng) || lat < 33 || lat > 39 || lng < 124 || lng > 132) {
          setMapError('유효하지 않은 좌표입니다.');
          return;
        }

        // 카카오맵 API가 사용하는 위경도 객체 생성
        const center = new window.kakao.maps.LatLng(lat, lng);

        // 지도 생성에 필요한 옵셜 설정(중심 좌표, 확대 레벨)
        const mapOption = {
          center, level: 5,
        };

        // 실제 지도 인스턴스 생성 및 mapRef의 DOM에 렌더링
        map = new window.kakao.maps.Map(mapRef.current!, mapOption);

        // 지도에 표시할 마커 생성
        new window.kakao.maps.Marker({ position: center, map: map });
       
        // 생성된 지도 인스턴스를 ref에 저장하여 재사용 가능하게 함
        mapInstance.current = map;

        // 지도 로딩 완료 상태로 변경
        setIsMapLoaded(true);
      })
      .catch((error) => {
        // 스크립트 로드나 지도 생성 실패 시 에러 처리
        console.error(error);
        setMapError('지도를 불러오지 못했습니다.');
      });
    
    // 컴포넌트가 사라지거나 data가 바뀌기 직전에 실행될 클린업 함수
    return () => {
      mapInstance.current = null;
    };
  }, [data]);

  useEffect(() => {
    if (!id) return;

    const restaurantId = Number(id);
    if (isNaN(restaurantId)) {
      console.error('유효하지 않은 식당 ID:', id);
      return;
    }

    /** 식당 상세 */
    const loadRestaurant = async () => {
      try {
        const restaurantData = await fetchRestaurantDetail(restaurantId);
        setData(restaurantData);
      } catch (e: any) {
        console.error('식당 데이터를 불러오지 못했습니다', e?.response?.data ?? e);
      }
    };

    /** 리뷰 게시글 썸네일 */
    const loadReviewPosts = async () => {
      try {
        const posts = await fetchRestaurantPost(id);
        setReviewPosts(posts);
      } catch (e) {
        console.error('식당 게시글 불러오기 실패', e);
      }
    };

    loadRestaurant();
    loadReviewPosts();
  }, [id]);

  useEffect(() => {
    const relayout = () => mapInstance.current?.relayout?.();
    window.addEventListener('resize', relayout);
    return () => window.removeEventListener('resize', relayout);
  }, []);

  const handleReservationClick = () => {
    if (isAuthenticated) openReservationModal();
    else openLoginModal();
  };

  if (!data) {
    return (
      <div className="p-5 text-center text-gray-500">
        식당 정보를 불러오는 중이거나 존재하지 않습니다...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-3 lg:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ──────────────── 메인 영역 ──────────────── */}
          <div className="lg:col-span-2 space-y-3">
            {/* Hero */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 식당 이미지 */}
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <img
                  src={data.restaurantImage.imageUrl || defaultImg}
                  alt={data.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 기본 정보 */}
              <div className="bg-white rounded-lg border border-gray-200 aspect-[4/3] flex flex-col justify-between">
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="w-fit text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {data.restaurantCategory.name}
                    </span>

                    <h1 className="text-2xl font-bold text-gray-900">
                      {data.name}
                    </h1>

                    <div className="flex flex-col gap-1 text-gray-600 text-sm">
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{data.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📞</span>
                        <span>{data.restaurantPhoneNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {data.restaurantTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 border border-gray-300 rounded text-gray-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  <button
                    onClick={handleReservationClick}
                    className="w-full py-3 text-base font-semibold bg-main text-white rounded-lg shadow-md"
                  >
                    예약하기
                  </button>
                </div>
              </div>
            </div>

            

            {/* 리뷰 썸네일 */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 pb-2 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>👥</span>
                  방문자 평가
                </h3>
                <button
                  onClick={() => navigate(`/posts?restaurantId=${id}`)}
                  className="text-orange-600 hover:text-orange-700 text-sm p-2 flex items-center gap-1"
                >
                  게시글 보기 <span>→</span>
                </button>
              </div>
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-2">
                  {reviewPosts.map((p) => (
                    <div
                      key={p.boardId}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                    >
                      <img
                        src={p.imageUrl || '/placeholder.svg'}
                        alt={`리뷰 ${p.boardId}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────── 사이드바 ──────────────── */}
          <div className="space-y-3">
            {/* 지도 */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 pb-2">
                <span className='text-sm font-semibold text-gray-700'>{data.address}</span>
              </div>
              <div className="px-4 pb-4">
                <div
                  id='map'
                  ref={mapRef}
                  className="w-full h-48 rounded-lg relative"
                  style={{ backgroundColor: '#e5e7eb', minHeight: 192 }}
                >
                  {!isMapLoaded && !mapError && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      지도를 불러오는 중...
                    </div>
                  )}
                  {mapError && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500 text-sm">
                      {mapError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* 영업시간 */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 pb-2">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span>🕐</span>
                  영업시간
                </h4>
              </div>
              <div className="px-4 pb-4 space-y-1">
                {data.restaurantOperatingHours.map((h, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="font-medium">{h.dayOfWeek}</span>
                    <span className={h.holiday ? 'text-red-500' : 'text-gray-600'}>
                      {h.holiday ? '휴무' : `${h.openTime}‑${h.closeTime}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 메뉴 */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 pb-2">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <span>🍽️</span>
                  메뉴
                </h4>
              </div>
              <div className="px-4 pb-4 space-y-1">
                {data.menus.map((m, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="font-medium">{m.name}</span>
                    <span className="font-semibold text-orange-600">
                      {m.price.toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>

        {/* 모바일 하단 고정 예약 버튼 */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-20">
          <button
            onClick={handleReservationClick}
            className="w-full py-3 text-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-md transition-colors"
          >
            예약하기
          </button>
        </div>

        {/* 콘텐츠와 버튼 겹침 방지 여백 */}
        <div className="lg:hidden h-20" />
      </div>

      {/* 예약 모달 */}
      {isReservationOpen && (
        <ReservationModal
          closeModal={closeReservationModal}
          restaurantId={Number(id)}
        />
      )}
      {/* 로그인 모달 */}
      {isLoginOpen && <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} />}
    </div>
  );
}
