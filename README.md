
# ChemiGuard 저작도구 웹 프로토타입 기술 설계서

> **버전:** 1.0
> **작성일:** 2025-05-10
> **목표:** '초거대 AI 확산 생태계 조성 사업'의 요구사항을 충족하는 저작도구 웹 애플리케이션의 신속한 프로토타입 개발

## 1. 개요

본 문서는 화학제품 유해성 정보 데이터 구축을 위한 저작도구(ChemiGuard) 웹 애플리케이션 프로토타입의 기술 스택, 아키텍처, 데이터베이스 스키마, 그리고 주요 기능 구현 계획을 정의한다. 개발 속도와 효율성을 극대화하기 위해 **Supabase 올인원 전략**을 채택하며, 프론트엔드는 React, 배포는 Netlify를 사용한다.

## 2. 시스템 아키텍처

프로토타입 단계에서는 인프라 구축의 복잡성을 최소화하고 프론트엔드 및 핵심 로직 개발에 집중하기 위해 다음과 같은 단순하고 강력한 아키텍처를 채택한다.

```
+----------------+      +----------------------+      +---------------------+
|   사용자 (웹)   |----->|   React App (UI)     |----->| Supabase Platform   |
| (작업자, 관리자) |      | (Hosted on Netlify)  |      | (BaaS)              |
+----------------+      +----------------------+      +----------+----------+
                                                         |          |
                                                         |    ┌─────┴─────┐
                                                         |    │   Auth    │ (인증)
                                                         |    ├───────────┤
                                                         |    │ Database  │ (PostgreSQL)
                                                         |    ├───────────┤
                                                         |    │  Storage  │ (파일 관리)
                                                         |    ├───────────┤
                                                         |    │ Functions │ (LLM 연동 등)
                                                         |    └─────┬─────┘
                                                         |          |
                                                         └──────────┼──────────> 외부 서비스 (LLM API 등)
```

-   **프론트엔드 (Client):** React.js
-   **호스팅 (Hosting):** Netlify (GitHub 연동을 통한 CI/CD)
-   **백엔드 (BaaS - Backend as a Service):** Supabase
    -   **인증 (Authentication):** Supabase Auth (이메일/비밀번호 기반 로그인)
    -   **데이터베이스 (Database):** Supabase 내장 PostgreSQL
    -   **서버리스 함수 (Serverless Functions):** Supabase Edge Functions (LLM API 호출 등 보안이 필요한 로직 처리)
    -   **파일 저장소 (Storage):** Supabase Storage (필요시 이미지, 문서 등 업로드)

## 3. 데이터베이스 스키마 (Supabase PostgreSQL)

Supabase 대시보드의 `Table Editor`를 사용하여 다음 스키마를 구현한다. 프로토타입 초기에는 RLS(Row Level Security)를 비활성화하여 빠른 개발을 진행하고, 기능 구현 후 보안 정책을 추가한다.

<details>
<summary><strong>테이블 상세 정의 (클릭하여 펼치기)</strong></summary>

-   **`products`** (작업 대상 제품)
    -   `id`: `bigint` (PK, auto-increment)
    -   `product_name_alias`: `varchar` (가명 처리된 제품명)
    -   `product_category`: `varchar` (제품 분류: '세정제', '살균제' 등)
    -   `status`: `varchar` (작업 상태: `pending`, `refining`, `processing`, `validation`, `completed`)
    -   `assignee_id`: `uuid` (FK -> `auth.users.id`, 담당자)
    -   `created_at`: `timestamptz` (default: `now()`)
    -   `updated_at`: `timestamptz`

-   **`chemicals`** (화학물질 마스터 정보)
    -   `id`: `bigint` (PK, auto-increment)
    -   `cas_no`: `varchar` (unique)
    -   `ghs_code`: `varchar`
    -   `iupac_name`: `text`
    -   `smiles`: `text`
    -   *기타 화학 정보 필드 추가...*

-   **`product_chemicals`** (제품-화학물질 연결 테이블, M:N 관계)
    -   `product_id`: `bigint` (FK -> `products.id`)
    -   `chemical_id`: `bigint` (FK -> `chemicals.id`)
    -   `concentration`: `varchar` (함량)
    -   **Primary Key:** (`product_id`, `chemical_id`)

-   **`captions`** (설명문)
    -   `id`: `bigint` (PK, auto-increment)
    -   `product_id`: `bigint` (FK -> `products.id`)
    -   `caption_type`: `varchar` (유형: `주성분`, `독성`, `경고문`)
    -   `content`: `text` (설명문 내용)
    -   `author_id`: `uuid` (FK -> `auth.users.id`, 작성자)
    -   `version`: `integer` (default: 1)

-   **`qa_pairs`** (질의응답 쌍)
    -   `id`: `bigint` (PK, auto-increment)
    -   `product_id`: `bigint` (FK -> `products.id`)
    -   `user_type`: `varchar` (대상: `일반사용자`, `전문가`)
    -   `qa_type`: `varchar` (질문 유형)
    -   `question`: `text`
    -   `answer`: `text`
    -   `author_id`: `uuid` (FK -> `auth.users.id`)

-   **`audit_logs`** (작업 이력)
    -   `id`: `bigint` (PK, auto-increment)
    -   `user_id`: `uuid` (FK -> `auth.users.id`)
    -   `action`: `varchar` (수행 작업: `CREATE_CAPTION`, `VALIDATE_PRODUCT`)
    -   `target_table`: `varchar`
    -   `target_id`: `bigint`
    -   `details`: `jsonb` (변경 상세 내용)
    -   `created_at`: `timestamptz` (default: `now()`)

</details>

## 4. 주요 기능 구현 계획

### 4.1. 사용자 인증

-   **구현 방식:** Supabase Auth와 React SDK를 사용하여 이메일/비밀번호 기반 로그인, 로그아웃, 회원가입 기능을 구현한다.
-   **로그인 상태 관리:** React Context API 또는 상태 관리 라이브러리(Zustand, Recoil 등)를 사용하여 전역적으로 사용자 세션을 관리한다.

### 4.2. 데이터 획득/관리 (CRUD)

-   **구현 방식:** React 컴포넌트에서 `supabase-js` SDK를 사용하여 DB 테이블에 직접 CRUD(Create, Read, Update, Delete) 작업을 수행한다.
-   **API 로직 분리:** 기능별(예: `products`, `chemicals`)로 API 호출 함수를 별도의 파일(`src/api/`)에 모듈화하여 관리한다. 이는 향후 마이그레이션을 용이하게 한다.
-   **주요 기능:**
    -   제품 목록 조회 및 필터링 (데모의 '데이터 관리' 페이지)
    -   제품 상세 정보 조회 및 수정
    -   신규 제품 등록

### 4.3. LLM 기반 자동화 기능

-   **구현 방식:** AI 기반 기능은 **Supabase Edge Functions**를 통해 구현한다. 이는 LLM API 키를 안전하게 보호하고 프롬프트 로직을 중앙에서 관리하기 위함이다.
-   **외부 서비스:** OpenAI(ChatGPT) 또는 Anthropic(Claude) API 사용을 우선 고려한다. (API 키 발급 필요)

#### 4.3.1. 설명문/QA 초안 생성

-   **함수명:** `generate-content`
-   **Input:** `{ type: 'caption' | 'qa', context: { ...chemicalInfo } }`
-   **Process:**
    1.  React 앱에서 'AI 추천 생성' 버튼 클릭 시, 현재 작업 중인 화학물질 정보를 담아 함수를 호출한다.
    2.  함수는 사전에 정의된 프롬프트 템플릿과 전달받은 정보를 조합하여 LLM API에 요청을 보낸다.
    3.  LLM이 생성한 텍스트 결과를 받아 React 앱으로 반환한다.
-   **Output:** `{ generatedText: '...' }`

#### 4.3.2. 자동 정제 (텍스트 표준화)

-   **함수명:** `refine-text`
-   **Input:** `{ text: '입력 텍스트' }`
-   **Process:** "다음 텍스트의 오탈자를 수정하고, 문체를 '하십시오' 체로 통일해 줘" 와 같은 프롬프트를 사용하여 텍스트를 표준화하고 결과를 반환한다.
-   **Output:** `{ refinedText: '...' }`

## 5. 개발 로드맵 (마일스톤)

1.  **Phase 1: 기반 구축 (1주차)**
    -   [ ] Supabase 프로젝트 생성 및 DB 스키마 설계/구현 (`products`, `chemicals` 테이블 우선)
    -   [ ] React 프로젝트에 Supabase 클라이언트 설정
    -   [ ] 로그인/로그아웃 페이지 및 라우팅 구현

2.  **Phase 2: 핵심 CRUD 기능 구현 (2주차)**
    -   [ ] 제품 목록을 조회하는 '데이터 관리' 페이지 구현
    -   [ ] 제품 상세 정보를 보고 수정할 수 있는 페이지 구현
    -   [ ] `src/api/` 디렉토리 구조를 만들어 API 로직 분리

3.  **Phase 3: LLM 연동 및 AI 기능 구현 (3주차)**
    -   [ ] LLM API 키 발급 및 Supabase Secrets에 등록
    -   [ ] `generate-content` Edge Function 개발 및 배포
    -   [ ] '데이터 가공' 페이지에서 'AI 추천 생성' 버튼을 통해 함수를 호출하고, 결과를 텍스트 필드에 채워 넣는 기능 구현

4.  **Phase 4: 고도화 및 검수 기능 (4주차)**
    -   [ ] 생성된 설명문/QA를 DB에 저장하는 로직 구현
    -   [ ] 데모의 '데이터 검수' 페이지 UI 구현
    -   [ ] RLS(Row Level Security)를 적용하여 기본적인 보안 정책 수립 (예: 로그인한 사용자만 쓰기 가능)

## 6. 향후 과제 (마이그레이션 고려사항)

본 프로토타입은 정식 서비스로의 원활한 전환을 염두에 두고 설계되었다.

-   **DB 마이그레이션:** Supabase DB(PostgreSQL)는 `pg_dump`를 통해 GCP Cloud SQL for PostgreSQL로 스키마와 데이터 손실 없이 이전 가능하다.
-   **API 마이그레이션:** `src/api/`에 분리된 API 모듈의 내부 구현만 GCP Cloud Run 엔드포인트를 호출하도록 수정하면 된다.
-   **인증 마이그레이션:** Supabase Auth는 GCP의 Identity Platform(Firebase Auth)으로 이전 가능하며, React 앱의 인증 관련 코드 일부 수정이 필요하다.

---