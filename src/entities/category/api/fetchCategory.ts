import { CategoryProps } from "../types/categoryType";
import { supabase } from "@/@shared/types/supabase";

export const fetchCategory = async (): Promise<CategoryProps[]> => {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("id", { ascending: true });

  if (error) {
    console.error("카테고리 데이터를 불러오지 못했습니다. : ", error);
    return [];
  }
  return data || [];
};
