import {
  RestaurantLandingData,
  RestaurantListData,
} from "../types/restaurantType";
import { supabase } from "@/@shared/types/supabase";

// 메인 랜딩 페이지 식당 전체 목록 조회
export const fetchRestaurantsLanding = async (): Promise<
  RestaurantLandingData[]
> => {
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      `
      id,
      name,
      address,
      restaurant_image,
      categories (name),
      restaurant_tags (tags (name))
    `,
    )
    .order("id", { ascending: true })
    .limit(4);

  if (error) {
    console.error("랜딩 페이지 식당 데이터 로드 실패 :", error);
    return [];
  }

  return (data || []).map((item: any) => {
    const categoryObj = Array.isArray(item.categories)
      ? item.categories[0]
      : item.categories;

    const tags = item.restaurant_tags
      ? item.restaurant_tags.map((rt: any) => rt.tags?.name).filter(Boolean)
      : [];

    return {
      id: item.id,
      name: item.name,
      address: item.address,
      categoryName: categoryObj?.name || "기타",
      restaurantTags: tags,
      imageUrl: item.restaurant_image || "",
      boardTags: [],
    };
  });
};

// 식당 검색 및 필터링 페이지네이션 조회
export const fetchRestaurantsList = async (
  currentPage: number,
  keyword: string = "",
  tagIds: number[] = [],
  sort: string = "",
): Promise<{ restaurants: RestaurantListData[]; totalPages: number }> => {
  const PAGE_SIZE = 6;
  const from = currentPage * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const validTagIds = Array.isArray(tagIds)
    ? tagIds.filter((id) => typeof id === "number" && !isNaN(id) && id > 0)
    : [];

  const selectQuery =
    validTagIds.length > 0
      ? `
      id,
      name,
      address,
      restaurant_phone_number,
      restaurant_image,
      xcoordinate,
      ycoordinate,
      categories (name),
      restaurant_tags!inner (tag_id, tags (name))
      `
      : `
      id,
      name,
      address,
      restaurant_phone_number,
      restaurant_image,
      xcoordinate,
      ycoordinate,
      categories (name),
      restaurant_tags (tag_id, tags (name))
      `;
  try {
    let query = supabase
      .from("restaurants")
      .select(selectQuery, { count: "exact" });

    if (keyword && keyword.trim() !== "") {
      const cleanKeyword = keyword.trim().toLowerCase();
      query = query.or(
        `name.ilike.%${cleanKeyword}%,address.ilike.%${cleanKeyword}%`,
      );
    }
    if (validTagIds.length > 0) {
      query = query.in("restaurant_tags.tag_id", validTagIds);
    }

    // 3. 정렬 조건
    if (sort === "name") {
      query = query.order("name", { ascending: true });
    } else {
      query = query.order("id", { ascending: true });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

    const processedRestaurant = (data || []).map((item: any) => {
      const categoryObj = Array.isArray(item.categories)
        ? item.categories[0]
        : item.categories;

      const tags = item.restaurant_tags
        ? item.restaurant_tags.map((rt: any) => rt.tags?.name).filter(Boolean)
        : [];

      return {
        id: item.id,
        name: item.name,
        address: item.address,
        restaurantPhoneNumber: item.restaurant_phone_number,
        restaurantImage: item.restaurant_image || null,
        restaurantCategory: categoryObj?.name || "기타",
        restaurantTags: tags,
        xcoordinate: item.xcoordinate,
        ycoordinate: item.ycoordinate,
      };
    });

    return {
      restaurants: processedRestaurant,
      totalPages: totalPages,
    };
  } catch (error) {
    console.error("식당 검색 리스트 로드 실패 : ", error);
    return { restaurants: [], totalPages: 1 };
  }
};

// 식당 상세 조회
export const fetchRestaurantDetail = async (id: string | number) => {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select(
        `
        *,
        categories (name),
        restaurant_operating_hours (*),
        menus (*),
        boards (
          id,
          content,
          created_at,
          members (
            nickname,
            profile_image
          ),
          board_images (
            image_url
          )
        )
        `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    let processedRestaurantImage: { imageUrl: string } | null = null;
    if (typeof data.restaurant_image === "string" && data.restaurant_image) {
      processedRestaurantImage = { imageUrl: data.restaurant_image };
    }

    return {
      id: data.id,
      name: data.name,
      address: data.address,
      restaurantPhoneNumber: data.restaurant_phone_number,
      restaurantImage: processedRestaurantImage,
      restaurantCategory: data.categories?.name || "기타",
      xcoordinate: data.xcoordinate,
      ycoordinate: data.ycoordinate,
      restaurantOperatingHours: data.restaurant_operating_hours || [],
      menus: data.menus || [],
      boards: data.boards || [],
    };
  } catch (error) {
    console.error("상세 페이지 데이터 조인 실패:", error);
    throw new Error("식당 데이터를 불러오지 못했습니다.");
  }
};
