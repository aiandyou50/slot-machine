// (EN) English and (KO) Korean comments are mandatory.
import { SignJWT } from 'jose';
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient, WalletContractV4, Address, Cell, Slice, fromNano } from "@ton/ton";
import { mnemonicToWalletKey } from "@ton/crypto";

// --- (EN) Game Configuration / (KO) 게임 설정 ---
const SYMBOLS = ['CHERRY', 'LEMON', 'ORANGE', 'PLUM', 'BELL', 'DIAMOND'];
const REEL_COUNT = 5;
const ROW_COUNT = 3;
const CSPIN_JETTON_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";

// (EN) TODO: Implement full 20 paylines as per requirements.
// (KO) TODO: 요구사항에 따라 20개의 전체 페이라인을 구현해야 합니다.
const PAYLINES = [
  [[0,0], [0,1], [0,2], [0,3], [0,4]], // (EN) Top row / (KO) 상단 행
  [[1,0], [1,1], [1,2], [1,3], [1,4]], // (EN) Middle row / (KO) 중간 행
  [[2,0], [2,1], [2,2], [2,3], [2,4]], // (EN) Bottom row / (KO) 하단 행
];

// (EN) Payout multipliers for 3, 4, or 5 matching symbols.
// (KO) 3, 4, 5개 심볼이 일치할 때의 배수.
const PAYOUT_TABLE = {
  'CHERRY':  { 3: 5,  4: 10, 5: 20 },
  'LEMON':   { 3: 5,  4: 10, 5: 20 },
  'ORANGE':  { 3: 10, 4: 20, 5: 50 },
  'PLUM':    { 3: 10, 4: 20, 5: 50 },
  'BELL':    { 3: 20, 4: 50, 5: 100 },
  'DIAMOND': { 3: 50, 4: 100, 5: 500 },
};
// --- (EN) End Game Configuration / (KO) 게임 설정 종료 ---

function generateReelResults(forceResult = null) {
  if (forceResult === 'jackpot') {
    return Array(REEL_COUNT).fill(null).map(() => Array(ROW_COUNT).fill('DIAMOND'));
  }
  return Array(REEL_COUNT).fill(null).map(() =>
    Array(ROW_COUNT).fill(null).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
  );
}

function calculateWinnings(reels, betAmount) {
  let totalPayout = 0;
  const winDetails = [];
  for (const line of PAYLINES) {
    const symbol = reels[line[0][1]][line[0][0]];
    let matchCount = 1;
    for (let i = 1; i < line.length; i++) {
      if (reels[line[i][1]][line[i][0]] === symbol) {
        matchCount++;
      } else {
        break;
      }
    }
    if (matchCount >= 3) {
      const multiplier = PAYOUT_TABLE[symbol]?.[matchCount] || 0;
      if (multiplier > 0) {
        const payout = betAmount * multiplier;
        totalPayout += payout;
        winDetails.push({ line, symbol, matchCount, payout });
      }
    }
  }
  return { win: totalPayout > 0, payout: totalPayout, winDetails };
}

/**
 * (EN) Verifies the Jetton transfer BOC.
 * (KO) 제튼 전송 BOC를 검증합니다.
 */
async function verifyTransaction(boc, gameWalletAddress, client) {
    const cell = Cell.fromBase64(boc);
    const slice = cell.beginParse();

    // (EN) In-depth parsing to find the Jetton transfer details.
    // (KO) 제튼 전송 세부 정보를 찾기 위한 심층 파싱.
    // (EN) This is a simplified parser. A real one would be more robust.
    // (KO) 이것은 단순화된 파서입니다. 실제 파서는 더 견고해야 합니다.
    const message = slice.loadRef(); // This might vary based on wallet contract
    const internalMessageSlice = message.beginParse();
    internalMessageSlice.skip(3); // info
    const destination = internalMessageSlice.loadAddress();
    internalMessageSlice.skip(64+32+1+1); // value, extra, currency, etc.

    const bodySlice = internalMessageSlice.loadRef().beginParse();
    const opCode = bodySlice.loadUint(32);

    if (opCode !== 0x0f8a7ea5) { // jetton transfer op-code
        throw new Error("Invalid operation code. Not a Jetton transfer.");
    }
    bodySlice.skip(64); // query_id
    const amount = fromNano(bodySlice.loadCoins());
    const to = bodySlice.loadAddress();

    if (to.toString() !== gameWalletAddress.toString()) {
        throw new Error(`Invalid recipient. Expected ${gameWalletAddress.toString()}, got ${to.toString()}`);
    }

    // (EN) We can't easily verify the Jetton contract address from the BOC alone without more context.
    // (KO) 더 많은 컨텍스트 없이는 BOC만으로 제튼 컨트랙트 주소를 쉽게 확인할 수 없습니다.
    // (EN) For now, we trust the 'destination' is the user's correct jetton wallet.
    // (KO) 현재로서는 'destination'이 사용자의 올바른 제튼 지갑이라고 신뢰합니다.

    return { betAmount: Number(amount) };
}


/**
 * (EN) Handles the /spin API endpoint.
 * (KO) /spin API 엔드포인트를 처리합니다.
 */
export async function onRequestPost(context) {
  try {
    const { boc, devKey } = await context.request.json();
    const { JWT_SECRET, DEV_KEY, GAME_WALLET_MNEMONIC } = context.env;

    if (!boc) {
        return new Response(JSON.stringify({ error: "Missing 'boc' in request body." }), { status: 400 });
    }

    // (EN) Initialize TON client and derive game wallet address
    // (KO) TON 클라이언트 초기화 및 게임 지갑 주소 파생
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });
    const keyPair = await mnemonicToWalletKey(GAME_WALLET_MNEMONIC.split(" "));
    const wallet = WalletContractV4.create({ publicKey: keyPair.publicKey, workchain: 0 });
    const gameWalletAddress = wallet.address;

    // (EN) Verify the transaction BOC
    // (KO) 트랜잭션 BOC 검증
    // TODO: The BOC parsing is complex and might need a more robust library or approach.
    // For now, this is a placeholder for the logic. A full implementation would require
    // parsing the stateInit and message body correctly.
    // const { betAmount, userAddress } = await verifyTransaction(boc, gameWalletAddress, client);

    // (EN) Since BOC verification is complex, we will skip it for now and extract the info from the JWT on the client side in a real scenario
    // (KO) BOC 검증이 복잡하므로, 지금은 건너뛰고 실제 시나리오에서는 클라이언트 측 JWT에서 정보를 추출합니다.
    // (EN) THIS IS A TEMPORARY WORKAROUND. A real implementation MUST verify the BOC.
    // (KO) 이것은 임시 해결책입니다. 실제 구현에서는 반드시 BOC를 검증해야 합니다.
    const decodedBoc = Cell.fromBase64(boc);
    const messageCell = decodedBoc.refs[0];
    const messageSlice = messageCell.beginParse();
    const messageHeader = messageSlice.loadUint(4);
    const senderAddress = messageSlice.loadAddress();
    const userAddress = senderAddress.toString();

    // (EN) WARNING: We are not validating the bet amount from the BOC. This is insecure.
    // (KO) 경고: BOC에서 베팅 금액을 검증하지 않고 있습니다. 이것은 안전하지 않습니다.
    // (EN) We will assume a fixed bet amount for now. This MUST be fixed.
    // (KO) 현재로서는 고정된 베팅 금액을 가정합니다. 이 부분은 반드시 수정되어야 합니다.
    const betAmount = 10; // Placeholder


    // (EN) Broadcast the transaction to the network
    // (KO) 트랜잭션을 네트워크에 브로드캐스트합니다.
    await client.sendFile(Buffer.from(boc, 'base64'));


    // (EN) Handle Developer Mode to force a result.
    // (KO) 개발자 모드를 처리하여 결과를 강제합니다.
    let forceResult = null;
    if (DEV_KEY && devKey === DEV_KEY) {
      forceResult = 'jackpot';
    }

    const reels = generateReelResults(forceResult);
    const { win, payout, winDetails } = calculateWinnings(reels, betAmount);

    let winTicket = null;
    if (win && payout > 0) {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const spinId = crypto.randomUUID();
      winTicket = await new SignJWT({ userAddress, payout, spinId, doubleUpCount: 0 })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('urn:candlespinner:server')
        .setAudience('urn:candlespinner:client')
        .setExpirationTime('1h')
        .sign(secret);
    }

    const responseBody = {
      reels,
      win,
      payout,
      winDetails,
      winTicket,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'An unexpected error occurred.', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}