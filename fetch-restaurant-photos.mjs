import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GOOGLE_PLACES_API_KEY) {
  console.error(
    "❌ .env.local에 SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / GOOGLE_PLACES_API_KEY 를 채워주세요.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLE_NAME = "restaurants";
const NAME_COLUMN = "name";
const ADDRESS_COLUMN = "address";
const ID_COLUMN = "id";
const IMAGE_COLUMN = "restaurant_image";

function buildProxyImageUrl(photoReference) {
  return `/api/place-photo?ref=${encodeURIComponent(photoReference)}`;
}

const DELAY_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findPhotoReference(name, address) {
  const query = `${name} ${address ?? ""}`.trim();

  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.photos",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: "ko",
        regionCode: "KR",
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Places API 오류 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const place = data.places?.[0];

  if (!place) {
    return null;
  }
  if (!place.photos || place.photos.length === 0) {
    return null;

    return place.photos[0].name;
  }

  async function main() {
    console.log("📥 Supabase에서 식당 목록 불러오는 중...");

    const { data: restaurants, error } = await supabase
      .from(TABLE_NAME)
      .select(
        `${ID_COLUMN}, ${NAME_COLUMN}, ${ADDRESS_COLUMN}, ${IMAGE_COLUMN}`,
      )
      .or(`${IMAGE_COLUMN}.ilike.%picsum%,${IMAGE_COLUMN}.eq.EMPTY`);

    if (error) {
      console.error("❌ Supabase 조회 실패:", error.message);
      process.exit(1);
    }

    console.log(`총 ${restaurants.length}개 식당 처리 시작\n`);

    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (const restaurant of restaurants) {
      const name = restaurant[NAME_COLUMN];
      const address = restaurant[ADDRESS_COLUMN];

      try {
        const photoRef = await findPhotoReference(name, address);

        if (!photoRef) {
          console.log(`⚠️  사진 없음: ${name}`);
          await supabase
            .from(TABLE_NAME)
            .update({ [IMAGE_COLUMN]: "NO_PHOTO_FOUND" })
            .eq(ID_COLUMN, restaurant[ID_COLUMN]);
          notFoundCount++;
          await sleep(DELAY_MS);
          continue;
        }

        const proxyUrl = buildProxyImageUrl(photoRef);

        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update({ [IMAGE_COLUMN]: proxyUrl })
          .eq(ID_COLUMN, restaurant[ID_COLUMN]);

        if (updateError) {
          throw updateError;
        }

        console.log(`✅ 저장 완료: ${name}`);
        successCount++;
      } catch (err) {
        console.error(`❌ 실패: ${name} — ${err.message}`);
        errorCount++;
      }

      await sleep(DELAY_MS);
    }

    console.log("\n========== 결과 요약 ==========");
    console.log(`성공: ${successCount}`);
    console.log(`사진 없음: ${notFoundCount}`);
    console.log(`실패: ${errorCount}`);
    console.log("================================");
  }

  main();
}
