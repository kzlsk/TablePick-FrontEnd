import { supabase } from "@/@shared/types/supabase";
import { AddMemberInfoProps, MemberFormData } from "../types/memberType";

// 신규 회원 정보 추가
export const fetchAddMemberInfo = async (data: AddMemberInfoProps) => {
  const { data: newMember, error } = await supabase
    .from("members")
    .insert({
      gender: data.gender,
      birthdate: data.birthdate,
      phoneNumber: data.phoneNumber,
      memberTags: data.memberTags,
    })
    .select()
    .single();

  if (error) {
    console.error("회원 정보 생성 실패 : ", error);
    throw error;
  }
  return newMember;
};

// 회원 정보 수정
export const fetchUpdatedMemberInfo = async (
  formData: MemberFormData,
  memberId: number,
) => {
  try {
    const { error: memberError } = await supabase
      .from("members")
      .update({
        nickname: formData.nickname,
        gender: formData.gender?.toUpperCase() || "",
        birthdate: formData.birthdate,
        phoneNumber: formData.phoneNumber,
        memberTags: formData.memberTags,
      })
      .eq("id", memberId);

    if (memberError) throw memberError;

    if (formData.memberTags && formData.memberTags.length > 0) {
      const tagInserts = formData.memberTags.map((tagId: number) => ({
        memberId: memberId,
        tagId: tagId,
      }));

      const { error: insesrtTagError } = await supabase
        .from("member_tags")
        .insert(tagInserts);

      if (insesrtTagError) throw insesrtTagError;
    }
    return { success: true, message: "회원 정보가 성공적으로 수정되었습니다." };
  } catch (error) {
    console.error("회원 정보 수정 실패 : ", error);
    throw error;
  }
};

// 로그아웃 처리
export const fetchLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase 로그아웃 실패 : ", error);
    throw error;
  }
};
