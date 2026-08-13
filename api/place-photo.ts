import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref } = req.query;

  if (!ref || typeof ref !== "string") {
    res.status(400).send("ref 파라미터가 필요합니다");
    return;
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const googleUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=600&key=${apiKey}`;

  try {
    const googleRes = await fetch(googleUrl);

    if (!googleRes.ok) {
      res.status(googleRes.status).send("이미지를 불러오지 못했습니다");
      return;
    }

    const arrayBuffer = await googleRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = googleRes.headers.get("content-type") ?? "image/jpeg";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800");
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).send("서버 오류");
  }
}
