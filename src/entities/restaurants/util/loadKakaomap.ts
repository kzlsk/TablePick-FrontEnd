// 카카오맵 SDK 스크립트를 동적으로, 그리고 단 한 번만 로드하도록 관리

export function loadKakaoMapScript(): Promise<void> {
  // Promise 반환하여 스크립트 로딩의 성공/실패 비동기적으로 처리
  return new Promise((resolve) => {
    // 스크립트 이미 로드 시 즉시 성공 처리
    // if (window.kakao && window.kakao.maps) {
    //   resolve(); // 이미 로드됨
    //   return;
    // }
    // // 아직 로드되지 않았지만, 다른 곳에서 이미 script 태그를 만들고 있는지 확인
    // const existing = document.querySelector<HTMLScriptElement>(
    //   'script[src*="dapi.kakao.com"]',
    // );
    // if (existing) {
    //   if (window.kakao && window.kakao.maps) {
    //     window.kakao.maps.load(() => resolve());
    //   } else {
    //     existing.addEventListener(
    //       "load",
    //       () => {
    //         if (window.kakao && window.kakao.maps) {
    //           window.kakao.maps.load(() => resolve());
    //         } else {
    //           resolve();
    //         }
    //       },
    //       { once: true },
    //     );
    //     setTimeout(() => resolve(), 500);
    //   }
    //   return;
    // }
    // // 스크립트 태그가 없다면 새로 생성
    // const script = document.createElement("script");
    // // 스크립트 주소 설정
    // script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_JS_KEY}&libraries=services&autoload=false`;
    // // 비동기 로딩 설정
    // script.async = true;
    // script.onload = () => {
    //   if (window.kakao && window.kakao.maps) {
    //     window.kakao.maps.load(() => resolve());
    //   } else {
    //     resolve();
    //   }
    // };
    // // 스크립트 로딩 실패 시 실행될 콜백 함수
    // console.warn("Kakao SDK 1차 로드 가드 작동");
    // reject(new Error("Kakao Maps 스크립트 로드 실패"));
    // // 생성한 script 태그를 문서의 head에 추가하여 로드 시작
    // document.head.appendChild(script);
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => resolve());
    } else {
      // 혹시라도 스크립트 태그 로딩이 0.01초 늦어질 경우를 대비한 안전 가드
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
