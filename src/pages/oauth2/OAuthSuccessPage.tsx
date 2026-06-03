import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "@/features/auth/hook/useAuth";
import defaultProfile from "@/@shared/images/user.png";
import { supabase } from "@/@shared/types/supabase";

export default function OauthSuccess() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!isMounted) return;

      if (session) {
        try {
          setLoading(true);
          const supabaseUser = session.user;
          const metadata = supabaseUser.user_metadata;

          if (!supabaseUser || !supabaseUser.email) {
            throw new Error("유효하지 않은 사용자 정보");
          }

          const email = supabaseUser.email;

          const nickname =
            metadata?.name ||
            metadata?.full_name ||
            metadata?.custom_claims?.kakao_account?.profile?.nickname ||
            "맛객";

          const rawProfileImage =
            metadata?.avatar_url ||
            metadata?.picture ||
            metadata?.custom_claims?.kakao_account?.profile
              ?.profile_image_url ||
            "";

          const profileImage = rawProfileImage
            ? `https://wsrv.nl/?url=${encodeURIComponent(rawProfileImage.replace(/=s\d+-c/g, "=s400"))}`
            : defaultProfile;

          const gender =
            metadata?.gender ||
            metadata?.custom_claims?.kakao_account?.gender ||
            "";

          const birthdate = metadata?.birthdate || "";
          const phoneNumber =
            supabaseUser.phone || metadata?.phone_number || "";

          const createdAt = new Date(supabaseUser.created_at);
          const now = new Date();
          const isNewUser =
            (now.getTime() - createdAt.getTime()) / (1000 * 60) < 1;

          const normalizedUser = {
            id: supabaseUser.id as any,
            email: email,
            nickname: nickname,
            profileImage: profileImage,
            gender: gender,
            birthdate: birthdate,
            phoneNumber: phoneNumber,
            memberTags: [],
            createAt: supabaseUser.created_at,
            isNewUser: isNewUser,
          };

          login(normalizedUser);
          sessionStorage.setItem("userInfo", JSON.stringify(normalizedUser));

          const params = new URLSearchParams(location.search);
          const redirectUrl = params.get("redirect") || "/";

          subscription.unsubscribe();
          if (!isNewUser) {
            alert(`${nickname}님, 반가워요! 로그인이 완료되었습니다.`);
            navigate(redirectUrl);
          } else {
            alert("회원가입을 환영합니다! 추가 정보를 입력해 주세요.");
            navigate("/", { state: { redirectUrl, showFilterModal: true } });
          }
        } catch (err: any) {
          console.error("OAuth 상태 처리 중 예외 발생:", err);
          setError(err.message || "로그인 처리 중 오류가 발생했습니다.");
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    });

    const timeoutId = setTimeout(() => {
      if (loading && !error) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session && isMounted) {
            setError(
              "로그인 세션을 찾을 수 없습니다. 인증 세션 바인딩 타임아웃.",
            );
            setLoading(false);
          }
        });
      }
    }, 3000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [login, navigate, location.search]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 border-4 rounded-full border-t-transparent border-main animate-spin" />
        <p className="text-sm font-medium text-gray-500">
          테이블픽 안전 로그인 처리 중입니다...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <p className="mb-2 font-semibold text-red-500">인증 오류</p>
        <p className="max-w-sm mb-6 text-sm text-gray-600">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 text-white rounded-xl bg-main shadow-md font-semibold text-sm hover:opacity-90"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return null;
}
