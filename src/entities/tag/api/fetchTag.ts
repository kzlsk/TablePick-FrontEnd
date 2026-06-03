import { supabase } from "@/@shared/types/supabase";
import { TagProps } from "../types/tagType";

export const fetchTag = async (): Promise<TagProps[]> => {
  const { data, error } = await supabase
    .from("tags")
    .select(
      `
      id, name`,
    )
    .order("id", { ascending: true });

  if (error) {
    console.error("태그 데이터 불러오기 실패 : ", error);
    return [];
  }
  return data || [];
};
