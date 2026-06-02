import { useEffect, useRef, useState, Component, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useModal from "@/@shared/hook/useModal";
import ReservationModal from "@/pages/restaurants/components/ReservationModal";
import LoginModal from "@/@shared/components/Modal/LoginModal";
import useAuth from "@/features/auth/hook/useAuth";
import defaultImg from "@/@shared/images/logo.png";
import { fetchRestaurantDetail } from "@/entities/restaurants/api/fetchRestaurants";
import { fetchRestaurantPost } from "@/entities/post/api/fetchPosts";
import { loadKakaoMapScript } from "@/entities/restaurants/util/loadKakaomap";
import { RestaurantDetailData } from "@/entities/restaurants/types/restaurantType";

type RestaurantReviewPost = {
  boardId: number;
  imageUrl: string;
};

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <p className="text-center text-red-500">
          오류가 발생했습니다. 다시 시도해주세요.
        </p>
      );
    }
    return this.props.children;
  }
}

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<RestaurantDetailData | null>(null);
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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<kakao.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer || !data) return;

    loadKakaoMapScript()
      .then(() => {
        try {
          const { xcoordinate: lng, ycoordinate: lat } = data;
          if (
            isNaN(lat) ||
            isNaN(lng) ||
            lat < 33 ||
            lat > 39 ||
            lng < 124 ||
            lng > 132
          ) {
            setMapError("유효하지 않은 좌표입니다.");
            return;
          }

          const center = new window.kakao.maps.LatLng(lat, lng);
          const mapOption = { center, level: 5 };

          const map = new window.kakao.maps.Map(mapContainer, mapOption);
          new window.kakao.maps.Marker({ position: center, map });

          mapInstance.current = map;
          setIsMapLoaded(true);
          setMapError(null);

          setTimeout(() => {
            if (map) {
              map.relayout();
              map.setCenter(center);
            }
          }, 50);
        } catch (error) {
          console.error("카카오 맵 객체 생성 실패:", error);
          setMapError("지도를 불러오지 못했습니다.");
        }
      })
      .catch((error) => {
        console.error(error);
        setMapError("지도를 불러오지 못했습니다.");
      });

    return () => {
      mapInstance.current = null;
    };
  }, [data]);

  useEffect(() => {
    if (!id) return;
    const restaurantId = Number(id);
    if (isNaN(restaurantId)) {
      console.error("유효하지 않은 식당 ID:", id);
      setData(null);
      return;
    }

    const loadRestaurant = async () => {
      try {
        const restaurantData = await fetchRestaurantDetail(restaurantId);

        if (!restaurantData.restaurantImage) {
          console.warn(
            "restaurantImage is null for restaurant ID:",
            restaurantId,
          );
        }
        setData(restaurantData);
      } catch (e: any) {
        console.error(
          "식당 데이터를 불러오지 못했습니다",
          e?.response?.data ?? e,
        );
        setData(null);
      }
    };

    const loadReviewPosts = async () => {
      try {
        const posts = await fetchRestaurantPost(id);
        setReviewPosts(posts);
      } catch (e) {
        console.error("식당 게시글 불러오기 실패", e);
      }
    };

    loadRestaurant();
    loadReviewPosts();
  }, [id]);

  useEffect(() => {
    const relayout = () => mapInstance.current?.relayout?.();
    window.addEventListener("resize", relayout);
    return () => window.removeEventListener("resize", relayout);
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

  const imageUrl =
    typeof data.restaurantImage === "string"
      ? data.restaurantImage
      : (data.restaurantImage?.imageUrl ?? defaultImg);

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <div className="p-3 mx-auto max-w-7xl lg:p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={data.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="bg-white rounded-lg border border-gray-200 aspect-[4/3] flex flex-col justify-between">
                  <div className="flex flex-col gap-4 p-4">
                    <div className="flex flex-col gap-2">
                      <span className="w-fit text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {data.restaurantCategory.name}
                      </span>
                      <h1 className="text-2xl font-bold text-gray-900">
                        {data.name}
                      </h1>
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
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
                      className="w-full py-3 text-base font-semibold text-white rounded-lg shadow-md bg-main"
                    >
                      예약하기
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between p-4 pb-2">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <span>👥</span>
                    방문자 평가
                  </h3>
                  <button
                    onClick={() => navigate(`/posts?restaurantId=${id}`)}
                    className="flex items-center gap-1 p-2 text-sm text-orange-600 hover:text-orange-700"
                  >
                    게시글 보기 <span>→</span>
                  </button>
                </div>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-2">
                    {reviewPosts.map((p) => (
                      <div
                        key={p.boardId}
                        className="relative overflow-hidden rounded-lg cursor-pointer aspect-square"
                      >
                        <img
                          src={p.imageUrl || "/placeholder.svg"}
                          alt={`리뷰 ${p.boardId}`}
                          className="object-cover w-full h-full transition-transform hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 pb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {data.address}
                  </span>
                </div>
                <div className="px-4 pb-4">
                  <div
                    id="map"
                    ref={mapRef}
                    className="relative w-full h-48 rounded-lg"
                    style={{
                      width: "100%",
                      height: "200px",
                      backgroundColor: "#e5e7eb",
                    }}
                  >
                    {!isMapLoaded && !mapError && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        지도를 불러오는 중...
                      </div>
                    )}
                    {mapError && (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-red-500">
                        {mapError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 pb-2">
                  <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <span>🕐</span>
                    영업시간
                  </h4>
                </div>
                <div className="px-4 pb-4 space-y-1">
                  {data.restaurantOperatingHours.map((h: any, i) => {
                    const rawOpen = h.open_time || h.openTime;
                    const rawClose = h.close_time || h.closeTime;

                    const openTimeFormated = rawOpen
                      ? rawOpen.slice(0, 5)
                      : "미지정";
                    const closeTimeFormated = rawClose
                      ? rawClose.slice(0, 5)
                      : "미지정";

                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-gray-900">
                          {h.day_of_week || h.dayOfWeek}
                        </span>
                        <span
                          className={
                            h.holiday
                              ? "text-red-500 font-bold"
                              : "text-gray-500 font-semibold"
                          }
                        >
                          {h.holiday
                            ? "휴무"
                            : `${openTimeFormated} - ${closeTimeFormated}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-4 pb-2">
                  <h4 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <span>🍽️</span>
                    메뉴
                  </h4>
                </div>
                <div className="px-4 pb-4 space-y-1">
                  {data.menus?.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="font-medium">{m.name}</span>
                      <span className="font-semibold text-orange-600">
                        {m.price.toLocaleString()}원
                      </span>
                    </div>
                  )) || <p className="text-gray-600">메뉴 정보가 없습니다.</p>}
                </div>
              </div>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-white border-t shadow-lg lg:hidden">
            <button
              onClick={handleReservationClick}
              className="w-full py-3 text-lg font-semibold text-white transition-colors bg-orange-600 rounded-lg shadow-md hover:bg-orange-700"
            >
              예약하기
            </button>
          </div>
          <div className="h-20 lg:hidden" />
        </div>
        {isReservationOpen && (
          <ReservationModal
            closeModal={closeReservationModal}
            restaurantId={Number(id)}
          />
        )}
        {isLoginOpen && (
          <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} />
        )}
      </div>
    </ErrorBoundary>
  );
}
