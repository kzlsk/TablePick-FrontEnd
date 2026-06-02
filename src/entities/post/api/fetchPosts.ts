import { CardItemProps } from "@/@shared/types/cardItemsType";
import {
  Post,
  FetchPostsParams,
  PostData,
  RestaurantReviewPost,
  FetchPostResponse,
} from "../types/postType";
import defaultImage from "@/@shared/images/logo.png";
import { supabase } from "@/@shared/types/supabase";

export const convertedPostListData = (
  posts: Post[],
  defaultProfile: string,
): CardItemProps[] => {
  return posts.map((item, i) => ({
    id: item.id || i + 1,
    description: item.content || "내용 없음",
    restaurantName: item.restaurantName || "정보 없음",
    restaurantAddress: item.restaurantAddress || "정보 없음",
    restaurantCategoryName: item.restaurantCategoryName || "정보 없음",
    memberNickname: item.memberNickname || "정보 없음",
    memberProfileImage: item.memberProfileImage || defaultProfile,
    image: item.imageUrl || defaultImage,
    linkTo: `/posts/${item.id}`,
  }));
};

// 식당 리뷰 목록 요약 조회
export const fetchRestaurantPost = async (
  id: string | number,
): Promise<RestaurantReviewPost[]> => {
  const { data, error } = await supabase
    .from("boards")
    .select(
      `
      id,
      content,
      created_at,
      members (nickname),
      board_images (image_url)
      `,
    )
    .eq("restaurant_id", Number(id))
    .order("created_at", { ascending: false });

  if (error) {
    console.error("식당별 리뷰 로드 실패 : ", error);
    return [];
  }

  return (data || []).map((board: any) => {
    const firstImage =
      board.board_images && board.board_images.length > 0
        ? board.board_images[0].image_url
        : null;

    return {
      boardId: board.id,
      content: board.content,
      created_at: board.created_at,
      nickname: board.members?.nickname || "익명 유저",
      imageUrl: firstImage,
    };
  });
};

// 리뷰 상세 조회
export const fetchPostDetail = async (id: string): Promise<PostData> => {
  const { data, error } = await supabase
    .from("boards")
    .select(
      `
      id,
      content,
      created_at,
      restaurants (id, name, address, categories (name)),
      members (nickname, profile_image),
      board_images (image_url),
      board_tags (tags(name))
      `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("리뷰 상세 조회 실패 : ", error);
    throw new Error("리뷰 불러오기 실패");
  }

  const restaurantObj = Array.isArray(data.restaurants)
    ? data.restaurants[0]
    : data.restaurants;

  const memberObj = Array.isArray(data.members)
    ? data.members[0]
    : data.members;

  let categoryObj = { id: 0, name: "기타" };
  if (restaurantObj && restaurantObj.categories) {
    const rawCategory = Array.isArray(restaurantObj.categories)
      ? restaurantObj.categories[0]
      : restaurantObj.categories;

    if (rawCategory) {
      categoryObj = {
        id: Number((rawCategory as any).id) || 0,
        name: (rawCategory as any).name || "기타",
      };
    }
  }

  const images = data.board_images
    ? (Array.isArray(data.board_images)
        ? data.board_images
        : [data.board_images]
      )
        .map((img: any) => img.image_url)
        .filter(Boolean)
    : [];

  const rawBoardTags = (data as any).board_tags;
  const tags = rawBoardTags
    ? rawBoardTags.map((bt: any) => bt.tags?.name).filter(Boolean)
    : [];

  return {
    id: data.id,
    content: data.content,
    createdAt: data.created_at,
    restaurantName: restaurantObj?.name || "정보 없음",
    restaurantAddress: restaurantObj?.address || "정보 없음",
    restaurantCategoryName: categoryObj,
    memberNickname: memberObj?.nickname || "익명유저",
    memberProfileImage: memberObj?.profile_image || null,
    imageUrls: images,
    tagNames: tags,
  };
};

// 리뷰 리스트
export const fetchPosts = async ({
  restaurantId,
  page = 0,
  size = 6,
}: FetchPostsParams): Promise<FetchPostResponse> => {
  try {
    let countQuery = supabase
      .from("boards")
      .select("id", { count: "exact", head: true });

    if (restaurantId && !isNaN(Number(restaurantId))) {
      countQuery = countQuery.eq("restaurant_id", Number(restaurantId));
    }

    const { count } = await countQuery;
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / size) || 1;

    const from = page * size;
    const to = from + size - 1;

    if (from >= totalCount || totalCount === 0) {
      return { data: [], totalPages };
    }

    let query = supabase.from("boards").select(`
      id,
      content,
      created_at,
      updated_at,
      restaurant_id,
      restaurants (name, address, categories (name)),
      members (nickname, profile_image),
      board_images (image_url),
      board_tags (tags (name))
    `);

    if (restaurantId && !isNaN(Number(restaurantId))) {
      query = query.eq("restaurant_id", Number(restaurantId));
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const formattedPosts: Post[] = (data || []).map((board: any) => {
      const restaurantObj = Array.isArray(board.restaurants)
        ? board.restaurants[0]
        : board.restaurants;
      const memberObj = Array.isArray(board.members)
        ? board.members[0]
        : board.members;

      let categoryName = "기타";
      if (restaurantObj && restaurantObj.categories) {
        let targetCategory = restaurantObj.categories;

        while (Array.isArray(targetCategory) && targetCategory.length > 0) {
          targetCategory = targetCategory[0];
        }

        if (targetCategory && typeof targetCategory === "object") {
          categoryName = (targetCategory as any).name || "기타";
        }
      }

      let firstImage = null;
      if (board.board_images) {
        if (
          Array.isArray(board.board_images) &&
          board.board_images.length > 0
        ) {
          firstImage = board.board_images[0].image_url;
        } else if ((board.board_images as any).image_url) {
          firstImage = (board.board_images as any).image_url;
        }
      }

      const rawBoardTags = (board as any).board_tags;
      const tags = rawBoardTags
        ? rawBoardTags.map((bt: any) => bt.tags?.name).filter(Boolean)
        : [];

      return {
        id: board.id,
        content: board.content,
        createdAt: board.created_at,
        updatedAt: board.updated_at,
        restaurantName: restaurantObj?.name || "정보 없음",
        restaurantAddress: restaurantObj?.address || "정보 없음",
        restaurantCategoryName: categoryName,
        memberNickname: memberObj?.nickname || "익명유저",
        memberProfileImage: memberObj?.profile_image || null,
        imageUrl: firstImage,
        tagNames: tags,
      };
    });

    return {
      data: formattedPosts,
      totalPages: totalPages,
    };
  } catch (error) {
    console.error("게시글 목록 불러오기 실패 : ", error);
    throw error;
  }
};

export const fetchCreatePost = async (formData: FormData) => {
  try {
    const memberId = formData.get("memberId")
      ? Number(formData.get("memberId"))
      : null;
    const restaurantId = formData.get("restaurantId")
      ? Number(formData.get("restaurantId"))
      : null;
    const content = formData.get("content") as string;
    const imageFile = formData.get("image") as File;

    if (!restaurantId || !content) {
      throw new Error("필수 데이터가 누락되었습니다.");
    }

    const { data: newBoard, error: boardError } = await supabase
      .from("boards")
      .insert({
        member_id: memberId,
        restaurant_id: restaurantId,
        content: content,
      })
      .select()
      .single();

    if (boardError) throw boardError;

    if (imageFile && imageFile.size > 0) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${newBoard.id}-${Date.now()}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("board-images")
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("board-images").getPublicUrl(filePath);

      const { error: imgTableError } = await supabase
        .from("board_images")
        .insert({
          board_id: newBoard.id,
          image_url: publicUrl,
        });

      if (imgTableError) throw imgTableError;
    }

    return newBoard;
  } catch (error) {
    console.error("리뷰 등록 실패:", error);
    throw error;
  }
};

export const fetchDeletePost = async (id: number) => {
  const { data, error } = await supabase.from("boards").delete().eq("id", id);

  if (error) {
    console.error("리뷰 삭제 실패:", error);
    throw error;
  }
  return data;
};
