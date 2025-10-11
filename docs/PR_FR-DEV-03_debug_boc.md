Title: FR-DEV-03 — Temporary debugging: expose Base64 BOC and debug panel

Summary:
This PR adds temporary, production-safe debugging helpers to help diagnose the "Invalid magic" issue when users spin.

Changes:
- src/services/blockchain.js
  - Expose Base64 BOC and deep-link to window.__LAST_BASE64_BOC and window.__LAST_DEEP_LINK when localStorage 'BOC_DEBUG' === '1'.
  - Use console.error for debug outputs to increase visibility in production consoles.
  - Reuse computed base64Boc for payload to avoid duplicate toString calls.

- src/main.js
  - Add a small in-page debug panel that appears when localStorage 'BOC_DEBUG' === '1'. The panel displays the last Base64 BOC and provides a deep-link anchor for quick testing. Panel is local-only and non-persistent.

Why:
- Users reported "Invalid magic" and DevTools showed mangled deep-link payloads. We need a reliable way to capture the generated Base64 BOC on the production site without open logging by default.

How to use (QA / operator steps):
1. Open site https://aiandyou.me
2. Open DevTools -> Console
3. Run: localStorage.setItem('BOC_DEBUG','1'); location.reload();
4. Click Spin. The debug panel should appear in lower-right showing the Base64 BOC. You can also inspect window.__LAST_BASE64_BOC in the console.
5. Copy the Base64 string and paste into the issue ticket or DM to the developer for analysis.

Rollback:
- This is a small, isolated change. To roll back, revert the two modified files.

Security & privacy:
- The debug panel only appears when localStorage 'BOC_DEBUG' === '1' and is intended for developer use only. Do not enable on shared/public machines.
- No values are sent to any external endpoint by this change.

Notes:
- After root cause is found, remove these helpers in a follow-up PR.
