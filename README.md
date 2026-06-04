# 🍽️ Tablepick — 개인화 추천 기반 식당 예약 플랫폼

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white"/>
  <img src="https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white"/>
  <img src="https://img.shields.io/badge/Cypress-69D3A7?style=flat-square&logo=cypress&logoColor=black"/>
</p>

<p align="center">맛집 검색부터 예약까지, 테이블픽으로 한 번에</p>

---

## 📌 프로젝트 소개

맛집을 검색하고 예약할 수 있는 개인화 추천 기반 식당 예약 플랫폼입니다.  
프론트엔드 단독으로 UI 설계, 성능 최적화, E2E 테스트 자동화 전 과정을 담당했습니다.

- **개발 기간:** 2025.04 – 2025.06  
- **팀 구성:** FE 1 · BE 3 · AI 1
- **원본 팀 프로젝트 링크 :** https://github.com/orgs/4und-Cloud/repositories

---

## 🖥️ 시연 영상

https://github.com/user-attachments/assets/2b26af87-cc17-45c9-9f69-89b4a04ab9cd

---

## ⚙️ 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | React, TypeScript |
| Styling | Tailwind CSS |
| Server State | TanStack Query |
| Testing | Cypress |

---

## 🚀 핵심 성과
 
**⚡ 초기 로딩 2.8s → 1.8s (35% 단축)**
- `React.lazy` 코드 분할 적용 → 페이지 진입 시 필요한 코드만 로딩
- 미사용 라이브러리 제거 → 번들 크기 22% 감소 (1.8MB → 1.4MB)
  
**📉 API 요청 40% 절감 (10회 → 6회)**
- 페이지네이션 → `useInfiniteQuery` 무한 스크롤 전환
- 서버 상태 캐싱 적용 → 렌더링 속도 35% 개선
  
**🔐 카카오 로그인 CORS 트러블슈팅**
- 네트워크 탭에서 OPTIONS 메서드 거부 확인 → 백엔드와 WebConfig 수정
- 간헐적 재현 → OAuth 2.0 흐름 재검토 후 `window.location.href` 리다이렉트로 교체
- 로그인 실패율 20% → 0%
  
**🧪 E2E 테스트 자동화 (실행 시간 25% 단축)**
- Cypress로 인증 / 예약 / 알림 핵심 시나리오 자동화
- 커스텀 커맨드로 중복 제거
- `onBeforeLoad`로 sessionStorage 직접 주입 → 세션 초기화 문제 해결
---

## 🛠️ Backend Architecture Migration (Java Spring ➡️ Supabase)
Vercel을 통한 프론트엔드 자동 배포 환경에 최적화하고 인프라 관리 리소스를 최소화하기 위해, 기존 Java Spring 백엔드 구조를 서버리스 인프라인 Supabase로 전면 전환하였습니다.

### 🔄 주요 변경 및 구현 사항
* **인증 및 세션 관리 (Auth):** Spring Security 기반의 인증 루틴을 Supabase Auth 패키지로 이관하여 카카오 소셜 로그인 및 사용자 세션 유지 관리의 복잡성을 제거 (useContext 및 useRef 기반 동시성 제어 적용)
* **데이터베이스 및 API:** Spring Data JPA 레이어를 Supabase PostgreSQL 및 JS Client API로 대체하여 프론트엔드 단에서의 유연한 데이터 쿼리 구현
* **스토리지 관리:** 식당 이미지 및 유저 프로필 업로드 인프라를 Supabase Storage 인프라로 전환

---

## 🚀 1차 배포 (MVP) 현황 및 한계점 (Known Issues)

현재 Vercel을 통한 1차 배포 버전은 핵심 핵심 비즈니스 로직(예약 체크, 회원 관리 등)을 우선 검증하기 위한 MVP 스펙입니다.
<br />
아래 미구현 기능들은 순차적으로 패치될 예정입니다.

* **FCM 푸시 알림:** 웹 푸시 인증 및 백그라운드 핸들러 안정화를 위해 현재 관련 코드는 주석 처리된 상태입니다.
* **AI 기반 식당 추천 콘텐츠:** AI 추천 알고리즘 엔진 연동 전 단계로, 현재 메인 화면은 최신 등록 ID 기준 4개의 고정 콘텐츠로 임시 대체하여 UI 레이아웃을 검증하고 있습니다.
* **식당 이미지:** 일부 API 미연동 구역 및 이미지 누락 데이터는 기본 로고와 대체 이미지로 처리되었습니다.

---

## 📂 프로젝트 구조
FSD(Feature-Sliced Design) 아키텍처를 참고해 프로젝트 규모에 맞게 필요한 레이어만 적용했습니다.

```
src/
├── @shared/
│   ├── api/
│   ├── components/
│   ├── hook/
│   ├── images/
│   └── types/
├── app/
│   ├── provider/
│   ├── App.css
│   ├── App.tsx
│   ├── main.tsx
│   └── pageRouter.tsx
├── entities/
├── features/
└── pages/
```
