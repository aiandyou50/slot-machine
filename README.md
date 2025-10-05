# CandleSpinner

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](CHANGELOG.md)
[![Roadmap](https://img.shields.io/badge/roadmap-view-informational.svg)](roadmap.html)

**CandleSpinner** is a fully decentralized, serverless Web3 slot machine game built on the **TON (The Open Network)** blockchain. Test your luck in a world of sparkling gems and aim for the grand jackpot, all while maintaining full custody of your assets.

## ✨ Key Features

-   **5x3 Video Slot:** A modern 5-reel, 3-row slot machine with 20 fixed paylines.
-   **Dynamic Gameplay:** Features classic slot elements like Wilds (👑) and Scatters (🎁), with winning lines visually highlighted.
-   **Truly Decentralized:** Your funds are always in your own wallet. The game uses TON's Jetton standard for on-chain betting and payouts.
-   **Serverless Architecture:** Built with Cloudflare Pages and Functions for a low-cost, highly scalable, and maintenance-free experience.
-   **Transparent & Fair:** All game transactions are publicly verifiable on the TON blockchain.
-   **Developer Mode:** A built-in mode for testing payout logic by forcing jackpot wins.

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


# CandleSpinner
CandleSpinner는 TON (The Open Network) 블록체인 위에 구축된 완전 탈중앙화, 서버리스 Web3 슬롯머신 게임입니다. 반짝이는 보석의 세계에서 행운을 시험하고 대박을 노려보세요. 모든 자산은 플레이어의 지갑에 안전하게 보관됩니다.

## ✨ 주요 특징
 * 5x3 비디오 슬롯: 20개의 고정 페이라인을 갖춘 현대적인 5릴, 3열 슬롯머신입니다.
 * 다이나믹한 게임플레이: 와일드(👑)와 스캐터(🎁) 같은 클래식 슬롯 요소를 포함하며, 당첨 라인이 시각적으로 강조 표시됩니다.
 * 완전한 탈중앙화: 모든 자금은 항상 자신의 지갑에 있습니다. 게임은 온체인 베팅 및 지불을 위해 TON의 Jetton 표준을 사용합니다.
 * 서버리스 아키텍처: Cloudflare Pages 및 Functions로 구축되어 저비용으로 높은 확장성을 가지며 유지보수가 필요 없는 환경을 제공합니다.
 * 투명성과 공정성: 모든 게임 트랜잭션은 TON 블록체인에서 공개적으로 검증 가능합니다.
 * 개발자 모드: 잭팟 당첨을 강제하여 지불 로직을 테스트할 수 있는 내장 모드입니다.

## 🚀 기술 스택
 * 프론트엔드: HTML, CSS, Vanilla JavaScript
 * 백엔드: Cloudflare Functions (Node.js)
 * 블록체인: The Open Network (TON)
 * 라이브러리:
   * @tonconnect/ui: 원활한 지갑 연결을 위해 사용됩니다.
   * @ton/core, @ton/crypto, @ton/ton: 블록체인 상호작용을 위해 사용됩니다.
 * 배포: Cloudflare Pages

## 🏗️ 아키텍처 개요
CandleSpinner는 간단하면서도 강력한 서버리스 아키텍처로 작동합니다:
 * 클라이언트 (브라우저): 사용자는 Cloudflare Pages에서 호스팅되는 정적 프론트엔드(/public 폴더)와 상호작용합니다.
 * 지갑 연결: @tonconnect/ui를 통해 사용자의 TON 지갑에 안전하게 연결합니다.
 * 베팅: 사용자가 스핀을 돌리면, 프론트엔드는 Jetton 전송 트랜잭션을 구성하여 사용자 지갑으로 보내 승인을 요청합니다. 이 과정은 비수탁(non-custodial) 방식으로 진행됩니다.
 * 게임 로직: 트랜잭션이 성공적으로 브로드캐스트되면, 프론트엔드는 백엔드 API 엔드포인트(/spin)를 호출합니다.
 * 백엔드 (Cloudflare Function): /functions/spin.js 워커가 요청을 받아 가중치 릴을 사용하여 무작위 슬롯 결과를 생성하고 당첨금을 계산합니다.
 * 지불: 사용자가 당첨되면, 백엔드 함수는 Cloudflare 환경 변수로 안전하게 저장된 자체 게임 지갑의 자격 증명을 사용하여 상금 트랜잭션을 생성하고 사용자의 지갑으로 직접 전송합니다.

## ⚙️ 설정 및 배포
이 프로젝트는 Cloudflare Pages에서의 원클릭 배포를 위해 설계되었습니다.
 * GitHub에서 이 저장소를 포크(Fork)하세요.
 * 새 Cloudflare Pages 프로젝트를 생성하고 포크한 저장소에 연결하세요.
 * 빌드 설정을 구성하세요:
   * 빌드 명령어: 비워두세요.
   * 빌드 출력 디렉토리: public
   * 루트 디렉토리: 그대로 두세요.
 * Cloudflare Pages 대시보드의 설정 > 환경 변수에서 환경 변수를 추가하세요:
   * GAME_WALLET_MNEMONIC: 상금 지불에 사용되는 게임 핫월렛의 24단어 비밀 복구 구문입니다.
   * DEV_KEY: 개발자 모드를 활성화하기 위한 비밀 암호입니다.
 * Node.js 호환성을 활성화하세요: wrangler.toml 파일에 다음 플래그가 있는지 확인하세요. Cloudflare Pages가 이 파일을 자동으로 감지하고 사용합니다.
   compatibility_flags = ["nodejs_compat"]

 * 배포하세요! Cloudflare가 자동으로 사이트를 빌드하고 배포합니다. 앞으로 main 브랜치에 푸시할 때마다 새로운 배포가 트리거됩니다.

## 🗺️ 개발 로드맵
개발 진행 상황과 향후 계획을 추적하기 위한 공개 로드맵이 있습니다. roadmap.html 파일에서 확인할 수 있습니다

## 📜 라이선스
이 프로젝트는 Apache License 2.0에 따라 라이선스가 부여됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.
