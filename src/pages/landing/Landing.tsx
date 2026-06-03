import { Suspense, lazy } from "react";
import loc from "@/@shared/images/location.png";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
const AddinfoModal = lazy(() => import("./components/AddInfoModal"));
import content from "@/@shared/images/content.png";
import useAuth from "@/features/auth/hook/useAuth";
import { fetchPosts } from "@/entities/post/api/fetchPosts";
import { Post } from "@/entities/post/types/postType";
import { fetchRestaurantsLanding } from "@/entities/restaurants/api/fetchRestaurants";
import { RestaurantLandingData } from "@/entities/restaurants/types/restaurantType";
import logo from "@/@shared/images/logo.png";

// 레스토랑 카드 컴포넌트
function RestaurantCard({
  item,
  onClick,
}: {
  item: RestaurantLandingData;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="w-[250px] h-[400px] border border-gray-300 rounded-2xl cursor-pointer flex flex-col shadow-lg overflow-hidden"
    >
      {/* 이미지 컨테이너 */}
      <div className="w-full h-[250px] overflow-hidden">
        <img
          src={item.imageUrl || logo}
          alt={item.name}
          className="object-cover w-full h-full"
        />
      </div>

      {/* 텍스트 영역 */}
      <div className="flex flex-col justify-between flex-grow px-4 py-3">
        {/* 이름 + 카테고리 */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold truncate">{item.name}</span>
          </div>

          {/* 주소 */}
          <div className="flex items-start gap-1 mt-1 text-gray-600 text-medium">
            <img
              width={24}
              height={24}
              src={loc}
              alt="location icon"
              className="w-4 h-4 mr-1"
            />
            <span className="line-clamp-2">{item.address}</span>
          </div>
        </div>

        {/* 태그 */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 w-max">
            {item.categoryName && (
              <span className="text-sm bg-main text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                {item.categoryName}
              </span>
            )}
            {item.tagNames?.length > 0 &&
              item.tagNames.map((tag, index) => (
                <span
                  key={index}
                  className="whitespace-nowrap bg-gray-200 text-primary text-sm px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 포스트 카드 컴포넌트
function PostCard({ item, onClick }: { item: Post; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="w-[250px] h-[400px] border border-gray-300 rounded-2xl cursor-pointer flex flex-col shadow-lg overflow-hidden"
    >
      {/* 이미지 컨테이너 */}
      <div className="w-full h-[250px] overflow-hidden">
        <img
          src={item.imageUrl || logo}
          alt={item.restaurantName}
          className="object-cover w-full h-full"
        />
      </div>

      {/* 텍스트 영역 */}
      <div className="flex flex-col justify-between flex-grow px-4 py-3">
        {/* 이름 + 카테고리 */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold truncate">
              {item.restaurantName}
            </span>
          </div>

          {/* 내용 */}
          <div className="flex items-start gap-1 mt-1 text-gray-600 text-medium">
            <img
              width={24}
              height={24}
              src={content || logo}
              alt="location icon"
              className="w-4 h-4 mr-1"
            />
            <span className="line-clamp-2">{item.content}</span>
          </div>
        </div>

        {/* 태그 */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 w-max">
            {item.restaurantCategoryName && (
              <span className="text-sm bg-main text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                {item.restaurantCategoryName}
              </span>
            )}
            {item.tagNames?.length > 0 &&
              item.tagNames.map((tag, index) => (
                <span
                  key={index}
                  className="whitespace-nowrap bg-gray-200 text-primary text-sm px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  // 상태 정의
  const [posts, setPosts] = useState<Post[]>([]); // 게시글 목록
  const [restaurants, setRestaurants] = useState<RestaurantLandingData[]>([]); // 레스토랑 목록
  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAddInfoModalOpen, setIsAddInfoModalOpen] = useState(false);

  const redirectUrl = location.state?.redirectUrl || "/";

  //게시글 데이터 가져오기
  const loadPosts = useCallback(async () => {
    try {
      const { data } = await fetchPosts({ page: 0, size: 4 });
      setPosts(data);
    } catch (error) {
      console.error("게시글 데이터 가져오기 실패:", error);
      setPosts([]);
    }
  }, []);

  // 레스토랑 데이터 가져오기
  const loadRestaurants = useCallback(async () => {
    try {
      const restaurantsData = await fetchRestaurantsLanding();
      setRestaurants(restaurantsData);
    } catch (error) {
      console.error("레스토랑 데이터 가져오기 실패:", error);
      setRestaurants([]);
    }
  }, []);

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    loadRestaurants();
    loadPosts();
  }, []);

  // 네비게이션 핸들러
  const handleResDetail = (id: number) => navigate(`/restaurants/${id}`);
  const handlePostDetail = (id: number) => navigate(`/posts/${id}`);

  // 모달 열기/닫기 함수
  useEffect(() => {
    if (isAuthenticated && user?.isNewUser) {
      setIsAddInfoModalOpen(true);
    } else {
      setIsAddInfoModalOpen(false);
    }
  }, [isAuthenticated, user?.isNewUser]);

  const handleCloseAddInfoModal = useCallback(() => {
    setIsAddInfoModalOpen(false);
    window.location.href = redirectUrl;
    if (user?.id) {
      sessionStorage.setItem(`hasCompletedAdditionalInfo_${user.id}`, "true");
      const updatedUser = { ...user, isNewUser: false };
      login(updatedUser);
    }
  }, [user, login]);

  return (
    <>
      {/* 유저 정보 입력 모달 */}
      {isAddInfoModalOpen && (
        <Suspense fallback={<div>로딩중...</div>}>
          <AddinfoModal
            isOpen={isAddInfoModalOpen}
            onClose={handleCloseAddInfoModal}
          />
        </Suspense>
      )}

      {/* 메인 컨텐츠 */}
      <div className="flex flex-col items-center flex-1 p-3">
        {/* 추천 매장 섹션 */}
        <section className="p-8 border-b border-gray-300">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tighter">
                  회원님을 위한 맛집 추천
                </h2>
                <p className="mt-1 text-lg text-gray-500">
                  회원님의 취향에 맞는 맛집을 추천해드려요
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-10 flex-nowrap">
              {restaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  item={restaurant}
                  onClick={() => handleResDetail(restaurant.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 추천 게시글 섹션 */}
        <section className="p-8 border-gray-300">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold tracking-tighter">
                  회원님을 위한 게시글 추천
                </h2>
                <p className="mt-1 text-lg text-gray-500">
                  회원님의 취향에 맞는 게시글을 추천해드려요
                </p>
              </div>
            </div>
            <div className="flex justify-center gap-10 flex-nowrap">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  item={post}
                  onClick={() => handlePostDetail(post.id)}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
