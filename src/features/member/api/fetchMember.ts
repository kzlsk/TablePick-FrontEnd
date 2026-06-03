import { supabase } from "@/@shared/types/supabase";
import { AddMemberInfoProps, MemberFormData } from "../types/memberType";

// 신규 회원 정보 추가
export const fetchAddMemberInfo = async (data: AddMemberInfoProps) => {
  const { data: newMember, error } = await supabase
    .from("members")
    .insert({
      id: data.id,
      nickname: data.nickname,
      profile_image: data.profile_image,
      gender: data.gender,
      birthdate: data.birthdate,
      phone_number: data.phoneNumber,
    })
    .select()
    .single();

  if (error) {
    console.error("회원 정보 생성 실패 : ", error);
    throw error;
  }
  if (data.memberTags && data.memberTags.length > 0) {
    await supabase.from("member_tags").delete().eq("member_id", data.id);
    for (const tagId of data.memberTags) {
      const { error: insertTagError } = await supabase
        .from("member_tags")
        .insert({
          member_id: data.id,
          tag_id: tagId,
        });

      if (insertTagError) {
        console.error("가입 단계 태그 매핑 실패:", insertTagError);
        throw insertTagError;
      }
    }
  }
  return newMember;
};

// 회원 정보 수정
export const fetchUpdatedMemberInfo = async (
  formData: MemberFormData,
  memberId: number | string,
) => {
  try {
    const { error: memberError } = await supabase.from("members").upsert(
      {
        id: memberId,
        nickname: formData.nickname,
        gender: formData.gender?.toUpperCase() || "",
        birthdate: formData.birthdate,
        phone_number: formData.phoneNumber,
      },
      { onConflict: "id" },
    );

    if (memberError) {
      console.error("members 테이블 upsert 실패:", memberError);
      throw memberError;
    }

    if (formData.memberTags && formData.memberTags.length > 0) {
      const { error: deleteTagError } = await supabase
        .from("member_tags")
        .delete()
        .eq("member_id", memberId);

      if (deleteTagError) throw deleteTagError;

      for (const tagId of formData.memberTags) {
        const { error: insertTagError } = await supabase
          .from("member_tags")
          .insert({
            member_id: memberId,
            tag_id: tagId,
          });

        if (insertTagError) throw insertTagError;
      }
    }

    return { success: true, message: "회원 정보가 성공적으로 수정되었습니다." };
  } catch (error) {
    console.error("회원 정보 수정 실패 : ", error);
    throw error;
  }
};

// 로그아웃 처리
export const fetchLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase 로그아웃 실패 : ", error);
      throw error;
    }

    sessionStorage.removeItem("userInfo");
    sessionStorage.clear();
    localStorage.removeItem("sb-rxefrilzdbvbuqiosufc-auth-token");

    window.location.href = "/";
  } catch (error) {
    console.error("로그아웃 프로세스 치명적 오류 : ", error);
    throw error;
  }
};

// 소셜 로그인 (Google / Kakao) 트리거
export const fetchSocialLogin = async (
  provider: "google" | "kakao",
  redirectUrl?: string,
) => {
  const targetRedirect = redirectUrl || encodeURIComponent("/");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `${window.location.origin}/oauth-success?redirect=${targetRedirect}`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) {
    console.error(`${provider} 로그인 트리거 실패:`, error);
    throw error;
  }

  return data;
};
