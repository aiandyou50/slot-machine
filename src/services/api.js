/**
 * (KO) 백엔드 API 통신을 위한 중앙 모듈
 * (EN) Central module for backend API communication
 */

/**
 * (KO) 사용자의 Jetton 지갑 주소를 백엔드 프록시를 통해 조회합니다.
 * (EN) Fetches the user's Jetton wallet address via the backend proxy.
 * @param {string} ownerAddress - (KO) 사용자 지갑 주소 (EN) The user's wallet address.
 * @param {string} jettonMinterAddress - (KO) Jetton 마스터 컨트랙트 주소 (EN) The Jetton master contract address.
 * @returns {Promise<string>} The user's Jetton wallet address.
 */
export async function getJettonWalletAddress(ownerAddress, jettonMinterAddress) {
  const response = await fetch('/getJettonWalletAddress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerAddress, jettonMinterAddress }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || 'Failed to get Jetton wallet address.'
    );
  }

  const { jettonWalletAddress } = await response.json();
  return jettonWalletAddress;
}

/**
 * (KO) Commit API를 호출하여 서버로부터 commitment를 받습니다.
 * (EN) Calls the commit API to get a commitment from the server.
 * @returns {Promise<string>} The commitment hash.
 */
export async function callCommitApi() {
  const response = await fetch('/commitSpin', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Commit API call failed.');
  }
  return data.commitment;
}

/**
 * (KO) Reveal API를 호출하여 스핀 결과를 받습니다.
 * (EN) Calls the reveal API to get the spin result.
 * @param {object} payload - The reveal payload.
 * @param {string} payload.commitment - The commitment from the commit phase.
 * @param {string} payload.clientSeed - The client-generated seed.
 * @param {string} payload.boc - The signed transaction BOC.
 * @param {number} payload.betAmount - The bet amount.
 * @param {string} payload.userAddress - The user's wallet address.
 * @returns {Promise<object>} The spin result from the backend.
 */
export async function callRevealApi(payload) {
  const response = await fetch('/revealSpin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Reveal API call failed.');
  }
  return data;
}

/**
 * (KO) 상금 수령 API를 호출합니다.
 * (EN) Calls the claim prize API.
 * @param {string} winTicket - (KO) JWT 당첨 티켓 (EN) The JWT win ticket.
 * @returns {Promise<object>} The claim result from the backend.
 */
export async function callClaimApi(winTicket) {
  const response = await fetch('/claimPrize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winTicket }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Claim prize API call failed.');
  }
  return data;
}

/**
 * (KO) 더블업 API를 호출합니다.
 * (EN) Calls the double up API.
 * @param {string} winTicket - (KO) 현재 JWT 당첨 티켓 (EN) The current JWT win ticket.
 * @param {string} choice - (KO) 사용자의 선택 ('red' 또는 'black') (EN) The user's choice ('red' or 'black').
 * @returns {Promise<object>} The double up result from the backend.
 */
export async function callDoubleUpApi(winTicket, choice) {
  const response = await fetch('/doubleUp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winTicket, choice }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Double up API call failed.');
  }
  return data;
}