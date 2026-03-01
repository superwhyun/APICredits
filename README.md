# AI Credit Dashboard 🚀

현존하는 주요 AI 서비스(OpenAI, x.ai, Moonshot AI)의 사용량과 크레딧 잔액을 한곳에서 쉽고 빠르게 모니터링할 수 있는 프리미엄 대시보드입니다.

## 주요 기능 (Key Features)

### 1. OpenAI 지능형 모니터링
- **실시간 데이터**: 이번 달 1일부터 현재까지의 사용량을 실시간으로 조회합니다.
- **자동 월별 캐싱**: 과거 5개월치의 월별 사용량을 자동으로 가져와 로컬 브라우저에 저장합니다. 이후 접속 시에는 추가 API 호출 없이 즉시 표시되어 매우 빠릅니다.
- **진행 상황 안내**: 초기 데이터 로딩 시 "??월 요금 가져오는 중..."과 같은 메시지를 통해 투명하게 진행 상황을 알려줍니다.

### 2. x.ai (Grok) 밸런스 체크
- **Prepaid/Postpaid 지원**: 선불형 잔액과 후불형 사용량을 모두 지원합니다.
- **사용량 게이지**: 설정된 한도 대비 현재 사용량을 시각적인 게이지로 보여줍니다.

### 3. Moonshot AI 상세 잔액
- **하이브리드 잔액 표시**: 현금 잔액(Cash)과 바우처(Voucher) 잔액을 구분하여 상세히 표시합니다.
- **만료 안내**: 바우처의 경우 만료 기한이 있을 수 있음을 알려주는 안내 메시지를 한국어로 제공합니다.

### 4. RunPod GPU 클라우드 잔액
- **실시간 잔액 조회**: GraphQL API를 통해 현재 계정의 `clientBalance`를 실시간으로 가져옵니다.
- **통합 모니터링**: GPU 및 서버리스 환경에 최적화된 잔액 정보를 대시보드에서 한눈에 확인할 수 있습니다.

### 4. 보안 및 성능 (Privacy & Performance)
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

### 3. Moonshot AI
- **키 발급처**: [Moonshot AI Platform](https://platform.moonshot.cn/console/api-keys)

### 4. RunPod (API Key with GraphQL Permissions)
- **키 발급처**: [RunPod Console - Settings](https://www.runpod.io/console/settings)
- **필요 권한**: 반드시 **GraphQL** (Read 또는 Full Access) 권한이 포함된 API Key여야 잔액 조회가 가능합니다.

---

## 로컬 테스트 (Local Testing)

개발 및 테스트 환경에 따라 다음 명령어를 사용하세요:

### 1. 프론트엔드 UI 개발
```bash
npm run dev
```
- Vite 기반의 빠른 핫 리로딩을 지원합니다. (기본 UI 작업 시 권장)

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
© 2026 Admin Dashboard Project.
