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
    <div className="p-5">
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
          <p className="ml-2">{data?.restaurantName}</p>
        </div>
        <div>
          <p>{data?.createdAt}</p> {/* 임시 작성일자 */}
        </div>
      </div>

      {/* 이미지 영역 */}
      <div className="flex flex-row gap-2 my-4">
        {data.imageUrls && data.imageUrls.length > 0 ? (
          data.imageUrls.slice(0, 3).map(
            (
              imageUrl,
              i, // 최대 3개의 이미지만 렌더링
            ) => (
              <div
                key={i}
                className="w-[calc(33.333%-1rem)] aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden"
              >
                <img
                  src={imageUrl || defaultPost}
                  srcSet={`${imageUrl.replace("600/400", "400/300")} 400w, 
                    ${imageUrl} 600w, 
                    ${imageUrl.replace("600/400", "800/600")} 800w`}
                  sizes="(max-width: 600px) 400px, (max-width: 900px) 600px, 800px"
                  alt={`Post Image ${i + 1}`}
                  className="object-cover w-full h-full rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            ),
          )
        ) : (
          // 이미지가 없을 경우 대체 UI
          <div className="flex items-center justify-center w-full text-gray-500 bg-gray-200 rounded-lg aspect-square">
            <img
              src={defaultPost}
              srcSet={`${defaultPost.replace("600/400", "400/300")} 400w, 
                    ${defaultPost} 600w, 
                    ${defaultPost.replace("600/400", "800/600")} 800w`}
              sizes="(max-width: 600px) 400px, (max-width: 900px) 600px, 800px"
              className="object-cover w-full h-full rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* 태그 영역 */}
      {/* <div className="my-4">
        <p className="font-semibold text-gray-800">태그</p>
        <div className="flex flex-wrap gap-2">
          {data..map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 text-sm text-blue-500 bg-blue-100 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div> */}

      {/* 내용 영역 */}
      <div className="my-4">
        <p className="font-semibold text-gray-800">내용</p>
        <p className="text-gray-600">{data?.content}</p>
      </div>
    </div>
  );
}
