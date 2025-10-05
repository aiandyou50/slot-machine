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