import { supabase } from "@/@shared/types/supabase";
import { Mypost } from "../types/postType";
import { CardItemProps } from "@/@shared/types/cardItemsType";

export const formatteddMypost = (posts: Mypost[]): CardItemProps[] => {
  return posts.map((post) => ({
    id: post.id,
    image: post.boardImage,
    description: post.content,
    restaurantName: post.restaurantName,
    tagNames: post.tagNames,
    linkTo: `/posts/${post.id}`,
  }));
};

// 내 리뷰 목록 조회
export const fetchMypost = async (
  memberId: number | string,
): Promise<CardItemProps[]> => {
  try {
    const { data, error } = await supabase
      .from("boards")
      .select(
        `
        id,
        content,
        restaurants (name),
        members (nickname),
        board_images (image_url),
        board_tags(
          tags(name))
        `,
      )
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rawMyPosts: Mypost[] = (data || []).map((post: any) => {
      const firstImage =
        post.board_images && post.board_images.length > 0
          ? post.board_images[0].image_url
          : null;

      const tags = post.board_tags
        ? post.board_tags.map((bt: any) => bt.tags?.name).filter(Boolean)
        : [];

      return {
        id: post.id,
        content: post.content,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        nickName: post.members?.nickname || "익명 유저",
        restaurantName: post.restaurants?.name || "알 수 없는 식당",
        boardImage: firstImage,
        tagNames: tags,
      };
    });

    return formatteddMypost(rawMyPosts);
  } catch (error) {
    console.error("내 게시글 가져오기 실패: ", error);
    throw error;
  }
};
