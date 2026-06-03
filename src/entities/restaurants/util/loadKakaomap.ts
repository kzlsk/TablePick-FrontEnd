export function loadKakaoMapScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => resolve());
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src*="dapi.kakao.com"]',
      );
      if (existing) {
        existing.addEventListener(
          "load",
          () => {
            window.kakao.maps.load(() => resolve());
          },
          { once: true },
        );
      } else {
        resolve();
      }
    }
  });
}
