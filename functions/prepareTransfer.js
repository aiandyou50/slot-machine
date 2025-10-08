// (EN/KO) Cloudflare Function to prepare a Jetton transfer payload server-side.
// This is used when client-side RPC calls fail. The server will compute the
// user's Jetton wallet address and create the transfer body (BOC) using TonWeb
// and return a TonConnect-compatible message for the client to sign.

import { getHttpEndpoint } from '@orbs-network/ton-access';
import TonWebImport from 'tonweb';

const TonWeb = TonWebImport.default || TonWebImport;

const CSPIN_JETTON_ADDRESS = "EQBZ6nHfmT2wct9d4MoOdNPzhtUGXOds1y3NTmYUFHAA3uvV";

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method === 'GET') {
    return new Response(JSON.stringify({ ok: true, message: 'prepareTransfer: POST { ownerAddress, amount }' }), { status: 200, headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders()) });
  }
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Use POST' }), { status: 405, headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders()) });

  try {
    const body = await request.json();
    const { ownerAddress, amount } = body;
    if (!ownerAddress || !amount) return new Response(JSON.stringify({ error: 'Missing ownerAddress or amount' }), { status: 400, headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders()) });

    const endpoint = await getHttpEndpoint({ network: 'testnet' });
    const tonweb = new TonWeb(new TonWeb.HttpProvider(endpoint));

    const tokenNamespace = tonweb.token || TonWeb.token;
    if (!tokenNamespace || !tokenNamespace.jetton) throw new Error('Jetton module not available on server');

    const jettonMinter = new tokenNamespace.jetton.JettonMinter(tonweb.provider, { address: CSPIN_JETTON_ADDRESS });

    // Compute user's Jetton wallet address server-side
    const userJettonWalletAddress = await jettonMinter.getJettonWalletAddress(new TonWeb.utils.Address(ownerAddress));

    const userJettonWallet = new tokenNamespace.jetton.JettonWallet(tonweb.provider, { address: userJettonWalletAddress.toString() });

    const bodyCell = await userJettonWallet.createTransferBody({
      queryId: 0,
      jettonAmount: TonWeb.utils.toNano(amount.toString()),
      toAddress: new TonWeb.utils.Address('U' + '0'.repeat(47)), // placeholder if needed; we will set to GAME_WALLET_ADDRESS on client
      responseAddress: new TonWeb.utils.Address(ownerAddress),
    });

    // Return payload as base64 and the user's jetton wallet address for client to build final message
    return new Response(JSON.stringify({
      success: true,
      userJettonWalletAddress: userJettonWalletAddress.toString(true, true, true),
      transferBodyBase64: bodyCell.toBoc().toString('base64')
    }), { status: 200, headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders()) });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'prepareTransfer failed', details: err.message }), { status: 500, headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders()) });
  }
}
