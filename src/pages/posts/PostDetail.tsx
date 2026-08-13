import location from "@/@shared/images/location.png";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import defaultPost from "@/@shared/images/restaurant.png";
import { fetchPostDetail } from "@/entities/post/api/fetchPosts";

type PostData = {
  id: number;
  restaurantName: string;
  restaurantAddress: string;
  restaurantCategoryName: { id: number; name: string };
  memberNickname: string;
  memberProfileImage: string;
  content: string;
  tagNames: string[];
  imageUrls: string[];
  createdAt: string;
};

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PostData | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetchPostDetail(id!);
        setData(response);
      } catch (error) {
        console.log("게시글 데이터 불러오기 실패 ");
      }
    };
    if (id) fetchPost();
  }, [id]);

  if (!data) {
    return (
      <div className="p-5 text-center text-gray-500">
        게시글을 불러오는 중이거나 존재하지 않습니다...
      </div>
    );
  }

  return (
    <div className="max-w-xl p-5 mx-auto my-6 bg-white rounded-lg shadow-sm">
      {/* 상단 정보 (위치 + 작성일자) */}
      <div className="flex flex-row justify-between">
        <div className="flex flex-row items-center">
          <img
            width={16}
            height={16}
            src={location}
            className="w-[16px] h-[16px]"
            alt="Location Icon"
          />
          <p className="ml-2 font-medium text-gray-800">
            {data?.restaurantName}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">{data?.createdAt}</p>
        </div>
      </div>

      {/* 이미지 영역 */}
      <div className="flex flex-row gap-2 my-4">
        {Array.from({ length: 3 }).map((_, i) => {
          const imageUrl = data.imageUrls?.[i];

          return (
            <div
              key={i}
              className="w-[calc(33.333%-0.34rem)] aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  sizes="(max-width: 600px) 400px, (max-width: 900px) 600px, 800px"
                  alt={`Post Image ${i + 1}`}
                  className="object-cover w-full h-full rounded-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <img
                  src={defaultPost}
                  alt="기본 이미지"
                  className="object-contain w-12 h-12 rounded-lg"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 태그 영역 */}
      {data.tagNames && data.tagNames.length > 0 && (
        <div className="my-4">
          <p className="font-semibold text-gray-800">태그</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {data.tagNames.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 text-sm text-blue-500 bg-blue-100 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 내용 영역 */}
      <div className="my-4">
        <p className="font-semibold text-gray-800">내용</p>
        <p className="mt-1 text-gray-600 whitespace-pre-wrap">
          {data?.content}
        </p>
      </div>
    </div>
  );
}
