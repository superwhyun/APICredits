# AI Credit Dashboard 🚀

현존하는 주요 AI 서비스(OpenAI, x.ai, OpenRouter, Moonshot AI, RunPod, Tavily, Vercel AI Gateway)의 사용량과 크레딧 잔액을 한곳에서 쉽고 빠르게 모니터링할 수 있는 프리미엄 대시보드입니다.

> **다른 PC에 설치하려면?** 앱스토어 배포 없이 GitHub에서 클론해 직접 로드하는 방식입니다. [다른 장비에 설치하기](#다른-장비에-설치하기-chrome-extension) 절차를 따르면 5분 안에 끝납니다.

## 주요 기능 (Key Features)

### 1. OpenAI 지능형 모니터링
- **실시간 데이터**: 이번 달 1일부터 현재까지의 사용량을 실시간으로 조회합니다.
- **자동 월별 캐싱**: 과거 5개월치의 월별 사용량을 자동으로 가져와 로컬 브라우저에 저장합니다. 이후 접속 시에는 추가 API 호출 없이 즉시 표시되어 매우 빠릅니다.
- **진행 상황 안내**: 초기 데이터 로딩 시 "??월 요금 가져오는 중..."과 같은 메시지를 통해 투명하게 진행 상황을 알려줍니다.

### 2. x.ai (Grok) 밸런스 체크
- **Prepaid/Postpaid 지원**: 선불형 잔액과 후불형 사용량을 모두 지원합니다.
- **사용량 게이지**: 설정된 한도 대비 현재 사용량을 시각적인 게이지로 보여줍니다.

### 3. OpenRouter 통합 모니터링
- **실시간 잔액 조회**: OpenRouter Credits API를 통해 `total_credits`와 `total_usage`를 가져옵니다.
- **잔액 계산**: 남은 크레딧(Estimated Balance)을 실시간으로 계산하여 표시합니다.
- **사용량 분석**: 전체 누적 크레딧 대비 현재 사용량을 시각화하여 보여줍니다.

### 4. Moonshot AI 상세 잔액
- **하이브리드 잔액 표시**: 현금 잔액(Cash)과 바우처(Voucher) 잔액을 구분하여 상세히 표시합니다.
- **만료 안내**: 바우처의 경우 만료 기한이 있을 수 있음을 알려주는 안내 메시지를 한국어로 제공합니다.

### 5. RunPod GPU 클라우드 잔액
- **실시간 잔액 조회**: GraphQL API를 통해 현재 계정의 `clientBalance`를 실시간으로 가져옵니다.
- **통합 모니터링**: GPU 및 서버리스 환경에 최적화된 잔액 정보를 대시보드에서 한눈에 확인할 수 있습니다.

### 6. Tavily 크레딧 조회
- **실시간 크레딧 확인**: Tavily Usage API를 통해 남은 크레딧과 사용량을 즉시 확인합니다.
- **플랜/리셋일 표시**: 현재 플랜과 크레딧 리셋 일자를 함께 보여줍니다.

### 7. Vercel AI Gateway 크레딧 조회
- **실시간 크레딧 확인**: Vercel AI Gateway Credits API를 통해 남은 잔액(`balance`)과 누적 사용량(`total_used`)을 즉시 확인합니다.
- **사용률 표시**: 전체 크레딧 대비 누적 사용량을 시각화하여 보여줍니다.

### 8. 보안 및 성능 (Privacy & Performance)
- **로컬 저장**: 모든 API Key와 월별 캐시 데이터는 사용자의 브라우저(`localStorage`)에만 저장됩니다. 서버에는 절대 전송되지 않습니다.
- **Vercel Proxy**: API Key 노출을 방지하기 위해 Vercel Serverless Functions를 프록시로 사용하여 안전하게 데이터를 요청합니다.

## API 설정 가이드 (API Key Requirements)

각 서비스의 정확한 사용량을 조회하기 위해서는 상위 권한이 있는 API Key가 필요할 수 있습니다.

### 1. OpenAI (Management/Organization Key)
- **필요 권한**: 전체 조직의 비용을 조회하려면 **Organization** 레벨의 권한이 있는 키가 필요합니다.
- **키 발급처**: [OpenAI API Keys](https://platform.openai.com/api-keys)
- **참고**: 프로젝트 전용 키가 아닌, 비용 관리 권한이 포함된 키를 사용해 주세요.

### 2. x.ai (Management Key)
- **키 발급처**: [x.ai Console](https://console.x.ai/)
- **참고**: 단순히 채팅용이 아닌, 계정 관리 및 잔액 조회가 가능한 관리자용 키를 권장합니다.

### 3. OpenRouter (Management Key)
- **필요 권한**: 크레딧 정보를 조회하려면 **Management Key** 권한이 활성화된 API 키가 필요할 수 있습니다.
- **키 발급처**: [OpenRouter API Keys](https://openrouter.ai/keys)

### 4. Moonshot AI
- **키 발급처**: [Moonshot AI Platform](https://platform.moonshot.ai/console/api-keys)

### 5. RunPod (API Key with GraphQL Permissions)
- **키 발급처**: [RunPod Console - Settings](https://www.runpod.io/console/settings)
- **필요 권한**: 반드시 **GraphQL** (Read 또는 Full Access) 권한이 포함된 API Key여야 잔액 조회가 가능합니다.

### 6. Tavily
- **키 발급처**: [Tavily Dashboard](https://app.tavily.com/home)
- **필요 권한**: Usage 조회가 가능한 일반 Tavily API Key를 사용하면 됩니다.

### 7. Vercel AI Gateway
- **키 발급처**: [Vercel AI Gateway](https://vercel.com/docs/ai-gateway/authentication-and-byok#api-key) (AI Gateway API Key)
- **참고**: 팀 단위로 발급되는 AI Gateway API Key를 사용하면 됩니다.

---

## 로컬 테스트 (Local Testing)

개발 및 테스트 환경에 따라 다음 명령어를 사용하세요:

### 1. 프론트엔드 UI 개발
```bash
npm run dev
```
- Vite 기반의 빠른 핫 리로딩을 지원합니다. (기본 UI 작업 및 로컬 API 테스트 시 권장)

### 2. 전체 기능 테스트 (Backend Proxy 포함)
```bash
npx vercel dev
```
- `/api/*.js`에 정의된 서버리스 함수를 포함하여 실제 배포 환경과 동일하게 테스트할 수 있습니다. (API 연동 확인 시 권장)

## 배포 가이드 (Deployment)

이 프로젝트는 **Vercel**에 최적화되어 있습니다.

### 방법 1: CLI 배포
```bash
npx vercel
```
- 터미널에서 즉시 배포하고 URL을 생성합니다.

### 방법 2: GitHub 연동 (권장)
1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속합니다.
2. `New Project`를 클릭하고 현재 리포지토리(`superwhyun/APICredits`)를 연결합니다.
3. `Deploy`를 클릭하면 이후 `git push`를 할 때마다 자동으로 배포됩니다.

---

## 다른 장비에 설치하기 (Chrome Extension)

이 프로젝트는 크롬 웹스토어에 올리지 않습니다. 새 PC에서는 GitHub에서 클론한 뒤 직접 빌드해서 "압축해제된 확장 프로그램"으로 로드합니다. 익스텐션 모드에서는 Vercel 서버가 필요 없고, 모든 API 호출이 브라우저에서 각 서비스로 직접 나갑니다.

### 준비물
- **Node.js 20 이상** (개발은 22에서 확인) — [nodejs.org](https://nodejs.org/) 또는 `nvm`, `brew install node`
- **Git**
- **Chrome** (또는 Edge, Brave 등 Chromium 계열)

### 1. 클론하고 빌드
```bash
git clone https://github.com/superwhyun/APICredits.git
cd APICredits
npm install
npm run build
```
- 빌드 결과물은 `dist/` 폴더에 생성됩니다. 이 폴더가 곧 익스텐션입니다.
- `dist/`는 `.gitignore`에 포함되어 있어 저장소에 없습니다. **클론 직후에는 반드시 빌드해야 합니다.**

### 2. 크롬에 로드
1. 주소창에 `chrome://extensions` 입력
2. 우측 상단 **개발자 모드(Developer mode)** 켜기
3. **압축해제된 확장 프로그램을 로드합니다(Load unpacked)** 클릭
4. 방금 클론한 폴더 안의 **`dist`** 폴더 선택 (프로젝트 루트가 아니라 `dist`)
5. 툴바의 퍼즐 아이콘 → `AI Credit Dashboard` 옆 핀 아이콘으로 고정

### 3. API 키 입력
익스텐션 아이콘을 클릭한 뒤 우측 상단 톱니바퀴(설정)에서 키를 입력합니다.

- 키는 **이 브라우저의 `localStorage`에만** 저장됩니다. 서버로 전송되지 않고, 크롬 계정 동기화도 되지 않으므로 **장비마다 다시 입력**해야 합니다.
- 각 서비스별 필요한 키 종류는 위의 [API 설정 가이드](#api-설정-가이드-api-key-requirements)를 참고하세요. 특히 x.ai는 일반 키가 아닌 **Management Key**, RunPod은 **GraphQL 권한** 키가 필요합니다.
- **OpenAI는 키 입력 후 "현재 잔액(기준점)"도 설정**해야 잔액이 표시됩니다. [platform.openai.com → Billing](https://platform.openai.com/settings/organization/billing/overview)에서 현재 잔액을 확인해 그대로 입력하세요. 크레딧을 충전한 뒤에도 다시 설정합니다.

### 4. 업데이트하기
코드가 바뀌면 다시 빌드하고 크롬에서 새로고침만 하면 됩니다. 키와 캐시는 그대로 유지됩니다.
```bash
cd APICredits
git pull
npm install        # 의존성이 바뀌었을 수 있으니 함께 실행
npm run build
```
그다음 `chrome://extensions`에서 `AI Credit Dashboard` 카드의 **새로고침(↻)** 버튼을 누릅니다.

### 5. 문제 해결
| 증상 | 원인과 조치 |
|---|---|
| 팝업이 새까맣게 나오거나 비어 있음 | `dist/`가 없거나 오래된 빌드입니다. `npm run build` 후 익스텐션 새로고침 |
| 키를 다시 입력해야 함 / 캐시가 사라짐 | 압축해제된 익스텐션의 ID는 **폴더 경로**로 정해집니다. 폴더를 옮기거나 이름을 바꾸면 새 익스텐션으로 인식되어 `localStorage`가 초기화됩니다. 경로를 고정해 두세요 |
| x.ai 잔액이 0 또는 오류 | 일반 API 키를 넣은 경우입니다. [console.x.ai](https://console.x.ai/)에서 Management Key를 발급받아 사용하세요 |
| OpenAI 카드에 잔액 대신 사용량만 표시 | 기준 잔액을 아직 설정하지 않은 상태입니다. 설정에서 현재 잔액을 입력하세요 |
| `npm install` 실패 | Node.js 버전을 확인하세요 (`node -v`가 20 이상이어야 합니다) |

### 참고: 익스텐션 모드의 통신 방식
- 익스텐션에서는 Vercel 프록시를 거치지 않고 `manifest.json`의 `host_permissions`에 허용된 도메인으로 **직접 호출**합니다.
- 응답이 빠르고, API Key가 브라우저 밖으로 나가지 않습니다.
- 새 서비스를 추가하면 `public/manifest.json`의 `host_permissions`에 해당 도메인을 넣고 다시 빌드해야 합니다.

---

---
© 2026 Admin Dashboard Project.
