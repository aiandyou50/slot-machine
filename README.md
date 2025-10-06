<div align="center">
  <a href="#-english">English</a> • <a href="#-korean-한국어">Korean (한국어)</a>
</div>

---

#  CandleSpinner (English)

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Version](https://img.shields.io/badge/version-3.0.0-brightgreen.svg)](CHANGELOG.md#300---2025-10-06)
[![Roadmap](https://img.shields.io/badge/roadmap-view-informational.svg)](roadmap.html)

**CandleSpinner** is a fully decentralized, serverless Web3 slot machine game built on the **TON (The Open Network)** blockchain. Test your luck in a world of cosmic gems and aim for the grand jackpot, all while maintaining full custody of your assets.

## ✨ Key Features

-   **5x3 Video Slot:** A modern 5-reel, 3-row slot machine with 20 fixed paylines.
-   **"Cosmic Gemstone" Theme:** A stunning visual theme with dynamic animations and sound effects.
-   **Multi-language Support:** Available in English, Korean, Japanese, and Chinese.
-   **Truly Decentralized:** Your funds are always in your own wallet. The game uses TON's Jetton standard for on-chain betting and payouts.
-   **Serverless Architecture:** Built with Cloudflare Pages and Functions for a low-cost, highly scalable, and maintenance-free experience.
-   **Transparent & Fair:** All game transactions are publicly verifiable on the TON blockchain.

## 🚀 Tech Stack

-   **Frontend:** HTML, CSS, Vanilla JavaScript
-   **Backend:** Cloudflare Functions (Node.js)
-   **Blockchain:** The Open Network (TON)
-   **Libraries:**
    -   `@tonconnect/ui`: For seamless wallet connections.
    -   `@ton/core`, `@ton/crypto`, `@ton/ton`: For blockchain interactions.
-   **Deployment:** Cloudflare Pages

## 🏗️ Architecture Overview

CandleSpinner operates on a simple yet powerful serverless architecture:

1.  **Client (Browser):** The user interacts with the static frontend hosted on Cloudflare Pages (`/public` folder).
2.  **Wallet Connection:** `@tonconnect/ui` securely connects to the user's TON wallet.
3.  **Betting:** When the user spins, the frontend constructs a Jetton transfer transaction and sends it to the user's wallet for approval. This is a non-custodial process.
4.  **Game Logic:** Upon successful transaction broadcast, the frontend calls a backend API endpoint (`/spin`).
5.  **Backend (Cloudflare Function):** The `/functions/spin.js` worker receives the request, generates the random slot result using weighted reels, and calculates any winnings.
6.  **Payout:** If the user wins, the backend function—using its own game wallet credentials stored securely as Cloudflare environment variables—creates and sends the prize transaction directly to the user's wallet.

## ⚙️ Configuration & Deployment

This project is designed for one-click deployment on **Cloudflare Pages**.

1.  **Fork this repository** on GitHub.
2.  **Create a new Cloudflare Pages project** and connect it to your forked repository.
3.  **Configure the build settings:**
    -   **Build command:** Leave this blank.
    -   **Build output directory:** `public`
    -   **Root directory:** Leave this as is.
4.  **Add Environment Variables** in the Cloudflare Pages dashboard under **Settings > Environment Variables**:
    -   `GAME_WALLET_MNEMONIC`: The 24-word secret mnemonic for the game's hot wallet, used for paying out prizes.
    -   `JWT_SECRET`: A secure, random string used for signing and verifying win tickets.
    -   `DEV_KEY`: A secret password to activate the developer mode.
5.  **Enable Node.js compatibility:** In your `wrangler.toml` file, ensure the following flag is present. Cloudflare Pages will automatically detect and use this file.
    ```toml
    compatibility_flags = ["nodejs_compat"]
    ```
6.  **Deploy!** Cloudflare will automatically build and deploy your site. Any future pushes to the `main` branch will trigger a new deployment.

## 🗺️ Development Roadmap

We have a public roadmap to track our development progress and future plans. You can view it here:

-   [**View the Roadmap**](roadmap.html)

## 📜 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

---

# CandleSpinner (Korean / 한국어)

[![라이선스](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![버전](https://img.shields.io/badge/version-3.0.0-brightgreen.svg)](CHANGELOG.md#300---2025-10-06)
[![로드맵](https://img.shields.io/badge/roadmap-view-informational.svg)](roadmap.html)

**CandleSpinner**는 **TON (The Open Network)** 블록체인 기반으로 제작된 완전 탈중앙화 서버리스 Web3 슬롯머신 게임입니다. 자산에 대한 완전한 소유권을 유지하면서, 우주 보석의 세계에서 행운을 시험하고 그랜드 잭팟에 도전하세요.

## ✨ 주요 특징

-   **5x3 비디오 슬롯:** 20개의 고정 페이라인을 갖춘 현대적인 5릴, 3행 슬롯머신입니다.
-   **"우주 보석" 테마:** 역동적인 애니메이션과 사운드 효과를 갖춘 아름다운 비주얼 테마입니다.
-   **다국어 지원:** 영어, 한국어, 일본어, 중국어를 지원합니다.
-   **완전한 탈중앙성:** 사용자의 자금은 항상 자신의 지갑에 있습니다. 게임은 온체인 베팅 및 상금 지급을 위해 TON의 젯톤 표준을 사용합니다.
-   **서버리스 아키텍처:** Cloudflare Pages와 Functions로 구축되어 저비용으로 높은 확장성을 가지며 유지보수가 필요 없는 환경을 제공합니다.
-   **투명성 및 공정성:** 모든 게임 트랜잭션은 TON 블록체인에서 공개적으로 검증 가능합니다.

## 🚀 기술 스택

-   **프론트엔드:** HTML, CSS, 순수 JavaScript
-   **백엔드:** Cloudflare Functions (Node.js)
-   **블록체인:** The Open Network (TON)
-   **라이브러리:**
    -   `@tonconnect/ui`: 원활한 지갑 연결 지원
    -   `@ton/core`, `@ton/crypto`, `@ton/ton`: 블록체인 상호작용
-   **배포:** Cloudflare Pages

## 🏗️ 아키텍처 개요

CandleSpinner는 간단하지만 강력한 서버리스 아키텍처로 작동합니다:

1.  **클라이언트 (브라우저):** 사용자는 Cloudflare Pages에서 호스팅되는 정적 프론트엔드(`public` 폴더)와 상호작용합니다.
2.  **지갑 연결:** `@tonconnect/ui`가 사용자의 TON 지갑에 안전하게 연결합니다.
3.  **베팅:** 사용자가 스핀을 돌리면, 프론트엔드는 젯톤 전송 트랜잭션을 구성하여 사용자의 지갑에 승인을 요청합니다. 이 과정은 비수탁형으로 이루어집니다.
4.  **게임 로직:** 트랜잭션이 성공적으로 전송되면, 프론트엔드는 백엔드 API 엔드포인트(`/spin`)를 호출합니다.
5.  **백엔드 (Cloudflare Function):** `/functions/spin.js` 워커가 요청을 받아 가중치 기반의 릴을 사용하여 무작위 슬롯 결과를 생성하고 당첨금을 계산합니다.
6.  **상금 지급:** 사용자가 당첨되면, 백엔드 함수는 Cloudflare 환경 변수로 안전하게 저장된 게임 지갑의 자격 증명을 사용하여 사용자의 지갑으로 직접 상금 트랜잭션을 생성하고 전송합니다.

## ⚙️ 설정 및 배포

이 프로젝트는 **Cloudflare Pages**에서의 원클릭 배포를 위해 설계되었습니다.

1.  GitHub에서 이 **리포지토리를 포크(Fork)** 하세요.
2.  새로운 **Cloudflare Pages 프로젝트를 생성**하고 포크한 리포지토리에 연결하세요.
3.  **빌드 설정을 구성**하세요:
    -   **빌드 명령어:** 비워두세요.
    -   **빌드 출력 디렉토리:** `public`
    -   **루트 디렉토리:** 그대로 두세요.
4.  Cloudflare Pages 대시보드의 **설정 > 환경 변수**에서 **환경 변수를 추가**하세요:
    -   `GAME_WALLET_MNEMONIC`: 상금 지급에 사용되는 게임 핫월렛의 24개 단어 시크릿 니모닉.
    -   `JWT_SECRET`: 당첨 티켓 서명 및 검증에 사용되는 안전하고 무작위적인 문자열.
    -   `DEV_KEY`: 개발자 모드를 활성화하기 위한 비밀 암호.
5.  **Node.js 호환성 활성화:** `wrangler.toml` 파일에 다음 플래그가 있는지 확인하세요. Cloudflare Pages는 이 파일을 자동으로 감지하여 사용합니다.
    ```toml
    compatibility_flags = ["nodejs_compat"]
    ```
6.  **배포!** Cloudflare가 자동으로 사이트를 빌드하고 배포합니다. 이후 `main` 브랜치에 푸시할 때마다 새로운 배포가 트리거됩니다.

## 🗺️ 개발 로드맵

개발 진행 상황과 향후 계획을 추적할 수 있는 공개 로드맵이 있습니다. 여기서 확인하실 수 있습니다:

-   [**로드맵 보기**](roadmap.html)

## 📜 라이선스

이 프로젝트는 Apache License 2.0에 따라 라이선스가 부여됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.