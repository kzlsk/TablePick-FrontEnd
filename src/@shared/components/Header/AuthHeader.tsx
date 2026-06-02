import logo from "@/@shared/images/logo_nobg.png";
import search from "@/@shared/images/magnifying-glass.png";
import alarmRing from "@/pages/notification/images/alarmRing.png";
import RoundedBtn from "@/@shared/components/Button/RoundedBtn";
import useModal from "@/@shared/hook/useModal";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "@/features/auth/hook/useAuth";
import SearchModal from "@/features/search/components/SearchModal";
import defaultProfile from "@/@shared/images/user.png";
import { fetchLogout } from "@/features/member/api/fetchMember";

export default function AuthHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { isAuthenticated, user, logout } = useAuth();
  //const { mutateAsync: removeFcmtoken } = useFcmTokenRemoveMutation();
  const searchModal = useModal({ initialState: false });

  const handleNavigateToAlarms = () => {
    navigate("/notifications");
  };

  const handleLogout = async () => {
    if (!window.confirm("정말 로그아웃 하시겠습니까?")) return;

    try {
      await fetchLogout();

      if (logout) logout();
    } catch (error) {
      console.error("헤더 로그아웃 핸들러 예외 발생:", error);
      alert("로그아웃 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex justify-center py-4 bg-white border-b border-main backdrop-blur">
        <div className="flex items-center justify-around h-16 gap-24">
          {/* logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Logo" height={40} width={120} />
          </Link>

          {/* 네비게이션 */}
          <nav className="flex items-center gap-10">
            <Link
              to="/"
              className={`text-lg font-bold ${pathname === "/" ? "text-main" : "text-black"} transition-colors hover:text-main`}
            >
              홈
            </Link>
            <Link
              to="/restaurants"
              className={`text-lg font-bold ${pathname === "/restaurants" ? "text-main" : "text-black"} transition-colors hover:text-main`}
            >
              맛집 리스트
            </Link>
            <Link
              to="/posts"
              className={`text-lg font-bold ${pathname === "/posts" ? "text-main" : "text-black"} transition-colors hover:text-main`}
            >
              게시글
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/reservation-check"
                  className={`text-lg font-bold ${pathname === "/reservation-check" ? "text-main" : "text-black"} transition-colors hover:text-main`}
                >
                  예약 확인
                </Link>
                <Link
                  to="/my-posts"
                  className={`text-lg font-bold ${pathname === "/my-posts" ? "text-main" : "text-black"} transition-colors hover:text-main`}
                >
                  내 게시글
                </Link>
                <Link
                  data-cy="header-my-page-button"
                  to="/mypage"
                  className={`text-lg font-bold ${pathname === "/mypage" ? "text-main" : "text-black"} transition-colors hover:text-main`}
                >
                  마이페이지
                </Link>
              </>
            )}
          </nav>

          {/* 우측 영역 */}
          <div className="flex items-center gap-4">
            <button
              onClick={searchModal.openModal}
              type="button"
              className="text-muted-foreground hover:text-foreground"
            >
              <img
                src={search}
                alt="Search"
                width={32}
                height={32}
                className="w-[32px] h-[32px]"
              />
            </button>

            {isAuthenticated && (
              <button
                onClick={handleNavigateToAlarms}
                type="button"
                className="relative text-muted-foreground hover:text-foreground"
              >
                <img
                  width={32}
                  height={32}
                  src={alarmRing}
                  alt="Notifications"
                  className="w-[32px] h-[32px]"
                />
              </button>
            )}
            <>
              <div>
                <img
                  data-cy="header-profile-image"
                  width={40}
                  height={40}
                  src={user.profileImage || defaultProfile}
                  alt="프로필"
                  className="object-cover w-10 h-10 rounded-full"
                />
              </div>

              <RoundedBtn
                data-cy="header-logout-button"
                onClick={handleLogout}
                text="Logout"
                bgColor="bg-main"
                textColor="text-white"
                hoverBorderColor="hover:border-main"
                hoverColor="hover:bg-white"
                hoverTextColor="hover:text-main"
              />
            </>
          </div>
        </div>
      </header>
      <SearchModal
        isOpen={searchModal.isOpen}
        onClose={searchModal.closeModal}
      />
    </>
  );
}
