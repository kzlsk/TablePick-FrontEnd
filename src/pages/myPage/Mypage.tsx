import { useState, useEffect, useMemo } from "react";
import FilterModal from "../../@shared/components/Modal/FilterModal";
import useModal from "../../@shared/hook/useModal";
import useAuth from "@/features/auth/hook/useAuth";
import defaultProfile from "@/@shared/images/user.png";
import { useTagQuery } from "@/entities/tag/hook/useTagQuery";
import { fetchUpdatedMemberInfo } from "@/features/member/api/fetchMember";
import { MemberFormData } from "@/features/member/types/memberType";
import { supabase } from "@/@shared/types/supabase";

type Gender = "" | "male" | "female";

interface MypageUserInfo {
  id: number | string;
  profileImage: string;
  nickname: string;
  email: string;
  gender?: string;
  birthdate?: string;
  phoneNumber?: string;
  memberTags?: number[];
  createAt?: string;
  isNewUser?: boolean;
}

const normalizeGender = (gender?: string): Gender => {
  if (!gender) return "";
  const normalized = gender.toUpperCase();
  return normalized === "MALE"
    ? "male"
    : normalized === "FEMALE"
      ? "female"
      : "";
};

const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^01[0-1|6-9]-\d{4}-\d{4}$/;
  return phoneRegex.test(phone);
};

const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};

export default function Mypage() {
  const { data: tagsItem, isLoading, isError } = useTagQuery();
  const { user, login } = useAuth();
  const { isOpen, openModal, closeModal } = useModal({ initialState: false });
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [initialFormData, setInitialFormData] = useState<MypageUserInfo | null>(
    null,
  );
  const [isPhoneValid, setIsPhoneValid] = useState(true);

  const [formData, setFormData] = useState<MypageUserInfo>({
    id: 0,
    profileImage: defaultProfile,
    nickname: "",
    email: "",
    gender: "",
    birthdate: "",
    phoneNumber: "",
    memberTags: [],
    createAt: "",
    isNewUser: false,
  });

  const tagNames = useMemo(() => {
    return (formData.memberTags || [])
      .map((tagId) => {
        const match = tagsItem?.find((tag) => tag.id === tagId);
        return match ? match.name : "";
      })
      .filter(Boolean);
  }, [formData.memberTags, tagsItem]);

  useEffect(() => {
    const syncMypageDataWithDatabase = async () => {
      if (!user?.id) return;

      try {
        const { data: dbUser, error: userError } = await supabase
          .from("members")
          .select("*")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;

        const { data: dbTags, error: tagsError } = await supabase
          .from("member_tags")
          .select("tag_id")
          .eq("member_id", user.id);

        if (tagsError) throw tagsError;

        const realMemberTags = dbTags
          ? dbTags.map((t: any) => Number(t.tag_id))
          : [];
        const formattedPhone = dbUser?.phone_number
          ? formatPhoneNumber(dbUser.phone_number)
          : "";

        const synchronizedData: MypageUserInfo = {
          id: user.id,
          profileImage:
            dbUser?.profile_image || user.profileImage || defaultProfile,
          nickname: dbUser?.nickname || user.nickname || "카카오 유저",
          email: user.email || "",
          gender: normalizeGender(dbUser?.gender),
          birthdate: dbUser?.birthdate || "",
          phoneNumber: formattedPhone,
          memberTags: realMemberTags,
          createAt: dbUser?.created_at || "",
          isNewUser: false,
        };

        setFormData(synchronizedData);
        setInitialFormData(synchronizedData);
        setSelectedTags(realMemberTags);
        setIsPhoneValid(
          formattedPhone ? isValidPhoneNumber(formattedPhone) : true,
        );

        login(synchronizedData);
      } catch (err) {
        console.error("마이페이지 실시간 데이터 동기화 실패:", err);
      }
    };

    if (isOpen === false) {
      syncMypageDataWithDatabase();
    }
  }, [user?.id]);

  const handleTagAdd = () => {
    setFormData((prev) => ({
      ...prev,
      memberTags: selectedTags,
    }));
    if (user) {
      const updatedUser: MypageUserInfo = {
        ...user,
        memberTags: selectedTags,
      };
      login(updatedUser);
    }
    closeModal();
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "phoneNumber") {
      const formatted = formatPhoneNumber(value);
      setFormData((prevState) => ({
        ...prevState,
        [name]: formatted,
      }));
      setIsPhoneValid(isValidPhoneNumber(formatted) || formatted.length < 12);
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleCancel = () => {
    if (initialFormData) {
      setFormData(initialFormData);
      setSelectedTags(initialFormData.memberTags || []);
    }
    alert("수정이 취소되었습니다");
  };

  const handleSave = async () => {
    if (!user?.id) {
      alert("유저 세션이 만료되었습니다. 다시 로그인해 주세요.");
      return;
    }
    if (!formData.nickname) {
      alert("닉네임은 필수 입력 항목입니다.");
      return;
    }
    if (!isValidPhoneNumber(formData.phoneNumber || "")) {
      alert("전화번호는 010-XXXX-XXXX 형식이어야 합니다.");
      return;
    }
    if (!formData.gender) {
      alert("성별을 선택해주세요.");
      return;
    }

    const convertedGender = formData.gender
      ? (formData.gender.toUpperCase() as "MALE" | "FEMALE")
      : "";

    const memberFormData: MemberFormData = {
      nickname: formData.nickname,
      gender: convertedGender,
      birthdate: formData.birthdate || "",
      phoneNumber: formData.phoneNumber || "",
      memberTags: formData.memberTags || [],
    };

    try {
      await fetchUpdatedMemberInfo(memberFormData, user.id);

      const updatedUser: MypageUserInfo = {
        ...user,
        nickname: formData.nickname,
        gender: convertedGender,
        birthdate: formData.birthdate,
        phoneNumber: formData.phoneNumber,
        profileImage: formData.profileImage || defaultProfile,
        memberTags: formData.memberTags || [],
      };

      login(updatedUser);
      sessionStorage.setItem("userInfo", JSON.stringify(updatedUser));

      setInitialFormData(formData);
      alert("정보 저장 완료");
    } catch (error: any) {
      console.error("유저 정보 저장 실패:", error);
      alert(`정보 저장 실패: ${error.message || "서버 오류"}`);
    }
  };

  if (isLoading) return <p>로딩 중...</p>;
  if (isError) return <p>태그 데이터를 불러오는 중 오류가 발생했습니다.</p>;
  if (!tagsItem) return null;

  return (
    <>
      <div className="mt-[80px] max-w-3xl mx-auto p-6 bg-white rounded-md shadow relative">
        <h2 className="mb-6 text-xl font-bold text-orange-500">
          회원 정보 수정
        </h2>

        {/* 좌측: 이미지와 관심 태그 */}
        <div className="flex items-start mb-6 space-x-6">
          {/* 프로필 이미지 */}
          <div className="flex-shrink-0">
            <img
              width={32}
              height={32}
              src={formData.profileImage || defaultProfile}
              alt="Profile"
              className="w-32 h-32 rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultProfile;
              }}
            />
          </div>

          {/* 관심 태그 */}
          <div className="flex-grow">
            <div className="mb-4">
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700"
              >
                관심 태그
              </label>
              <div className="relative mt-2">
                <div className="flex flex-wrap gap-2 pt-2 pr-12 overflow-y-auto rounded max-h-32 ">
                  {tagNames.length > 0 ? (
                    tagNames.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-block px-4 py-2 text-sm text-white rounded-full bg-main min-w-max"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">선택된 태그가 없습니다.</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    // user가 null이 아닐 때만 memberTags 접근
                    if (user && user.memberTags) {
                      setSelectedTags(user.memberTags);
                    } else {
                      setSelectedTags([]); // user 또는 memberTags가 없으면 빈 배열로
                    }
                    openModal();
                  }}
                  className="absolute right-0 px-3 text-lg text-white -translate-y-1/2 rounded-full bg-main top-1/2"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: form */}
        <div>
          <div className="mb-4">
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-gray-700"
            >
              이름
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className="w-full p-2 mt-2 border border-gray-300 rounded"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 mt-2 border border-gray-300 rounded"
              readOnly
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              성별
            </label>
            <div className="flex items-center">
              <label className="mr-5">
                <input
                  className="mr-2"
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === "male"}
                  onChange={handleChange}
                />{" "}
                남성
              </label>
              <label>
                <input
                  className="mr-2"
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === "female"}
                  onChange={handleChange}
                />{" "}
                여성
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="birth"
              className="block text-sm font-medium text-gray-700"
            >
              생일
            </label>
            <input
              type="date"
              id="birth"
              name="birthdate"
              value={formData.birthdate}
              onChange={handleChange}
              className="w-full p-2 mt-2 border border-gray-300 rounded"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              전화번호
            </label>
            <input
              type="tel"
              id="phone"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`mt-2 p-2 w-full border rounded ${isPhoneValid ? "border-gray-300" : "border-red-500"}`}
              placeholder="010-1234-5678"
            />
            {!isPhoneValid &&
              formData.phoneNumber &&
              formData.phoneNumber.length >= 12 && (
                <p className="mt-1 text-sm text-red-500">
                  유효한 전화번호 형식이 아닙니다. (010-XXXX-XXXX)
                </p>
              )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-300 rounded"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white bg-orange-500 rounded"
            >
              저장
            </button>
          </div>
        </div>
      </div>
      <FilterModal
        isOpen={isOpen}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        onClose={() => {
          closeModal();
        }}
        onClick={handleTagAdd}
      />
    </>
  );
}
