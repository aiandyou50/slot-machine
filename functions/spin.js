import { SignJWT } from 'jose';
import { Cell, loadMessage, fromNano, Address } from '@ton/core';

// (KO) JWT 비밀 키는 각 함수 요청 시 환경 변수에서 안전하게 로드됩니다.
// (EN) The JWT secret key is securely loaded from environment variables on each function request.
const GAME_WALLET_ADDRESS = "UQBFPDdSlPgqPrn2XwhpVq0KQExN2kv83_batQ-dptaR8Mtd";
const CSPIN_JETTON_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";

const SYMBOLS = ['CHERRY', 'LEMON', 'ORANGE', 'PLUM', 'BELL', 'DIAMOND'];
const WEIGHTS = { 'CHERRY': 50, 'LEMON': 40, 'ORANGE': 30, 'PLUM': 20, 'BELL': 10, 'DIAMOND': 5 };

function getWeightedRandomSymbol() {
  const totalWeight = Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  for (const symbol in WEIGHTS) {
    if (random < WEIGHTS[symbol]) return symbol;
    random -= WEIGHTS[symbol];
  }
  return SYMBOLS[0];
}

function generateReels() {
  return Array(5).fill(null).map(() => Array(3).fill(null).map(() => getWeightedRandomSymbol()));
}

function calculatePayoutMultiplier(reels) {
  if (reels[0][0] === 'DIAMOND' && reels[1][0] === 'DIAMOND' && reels[2][0] === 'DIAMOND') {
    return 100; // 100x multiplier
  }
  return 0;
}

async function verifyTransaction(boc, betAmount) {
    try {
        const messageCell = Cell.fromBoc(Buffer.from(boc, 'base64'))[0];
        const message = loadMessage(messageCell);

        const bodySlice = message.body.beginParse();
        const op = bodySlice.loadUint(32);
        if (op !== 0x0f8a7ea5) {
            throw new Error(`Invalid operation code. Expected 0x0f8a7ea5, got ${op.toString(16)}`);
        }

        bodySlice.loadUint(64); // query_id
        const jettonAmount = fromNano(bodySlice.loadCoins());
        const toAddress = bodySlice.loadAddress();

        if (jettonAmount !== betAmount.toString()) {
            throw new Error(`Bet amount mismatch. Expected ${betAmount}, got ${jettonAmount}`);
        }

        if (toAddress.toString() !== Address.parse(GAME_WALLET_ADDRESS).toString()) {
            throw new Error('Invalid recipient address.');
        }

        return { isValid: true, senderAddress: message.info.src.toString() };
    } catch (error) {
        console.error("BOC verification failed:", error);
        return { isValid: false, error: error.message };
    }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.JWT_SECRET) {
      console.error("CRITICAL: JWT_SECRET environment variable is not set.");
      return new Response(JSON.stringify({ error: "CONFIGURATION_ERROR", message: "Server configuration is incomplete." }), { status: 500 });
    }
    const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

    const { boc, betAmount, devKey } = await request.json();

    if (!boc || !betAmount) {
      return new Response(JSON.stringify({ error: "INVALID_REQUEST", message: "boc and betAmount are required." }), { status: 400 });
    }

    let userAddress;
    const isDevMode = devKey && devKey === env.DEV_KEY;
    if (!isDevMode) {
        const { isValid, error, senderAddress } = await verifyTransaction(boc, betAmount);
        if (!isValid) {
            return new Response(JSON.stringify({ error: "INVALID_TRANSACTION", message: `BOC verification failed: ${error}` }), { status: 400 });
        }
        userAddress = senderAddress;
    } else {
        // (KO) 개발 모드에서는 요청에서 주소를 가져옵니다.
        // (EN) In dev mode, get the address from the request.
        userAddress = (await request.json()).userAddress;
        if (!userAddress) {
             return new Response(JSON.stringify({ error: "INVALID_REQUEST", message: "userAddress is required for dev mode." }), { status: 400 });
        }
    }

    let reels, payout;
    if (isDevMode) {
      reels = [["DIAMOND", "DIAMOND", "DIAMOND"],["DIAMOND", "DIAMOND", "DIAMOND"],["DIAMOND", "DIAMOND", "DIAMOND"],["CHERRY", "CHERRY", "CHERRY"],["BELL", "BELL", "BELL"]];
      payout = 500;
    } else {
      reels = generateReels();
      const winMultiplier = calculatePayoutMultiplier(reels);
      payout = betAmount * winMultiplier;
    }

    const win = payout > 0;

    if (win) {
      const winTicket = await new SignJWT({ payout, spinId: crypto.randomUUID() })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(userAddress)
        .setIssuedAt()
        .setIssuer('urn:candlespinner:server')
        .setAudience('urn:candlespinner:client')
        .setExpirationTime('5m')
        .sign(JWT_SECRET);

      return new Response(JSON.stringify({ reels, win, payout, winTicket }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ reels, win, payout }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "INTERNAL_SERVER_ERROR", message: e.message }), { status: 500 });
  }
}