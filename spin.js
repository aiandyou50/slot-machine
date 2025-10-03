/**
 * POST /spin
 * This function is the serverless backend for the spin action.
 * It generates a random result for all 9 reels.
 */
export async function onRequest(context) {
  try {
    const symbols = ['💎', '💰', '🍀', '🔔', '🍒', '7️⃣'];
    const finalReels = [];

    // Generate a random symbol for each of the 9 reels
    for (let i = 0; i < 9; i++) {
        const randomIndex = Math.floor(Math.random() * symbols.length);
        finalReels.push(symbols[randomIndex]);
    }
    
    // TODO: Add logic to determine if the result is a win and calculate payout
    const result = {
      symbols: finalReels,
      isWin: false, // Placeholder
      payout: 0   // Placeholder
    };

    return new Response(JSON.stringify({
      success: true,
      message: "Spin successful!",
      data: result
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: "An error occurred during the spin."
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
