import './style.css'
import { TonConnectUI } from '@tonconnect/ui';

// ✅ [수정 1] : 버튼을 삽입할 HTML 요소의 id를 지정합니다.
const tonConnectUI = new TonConnectUI({
    manifestUrl: 'https://aiandyou.me/tonconnect-manifest.json',
    buttonRootId: 'ton-connect-wallet' 
});

document.querySelector('#app').innerHTML = `
  <div class="container">
    <div class="header">
      <h1>CandleSpinner</h1>
      <p>The Galactic Casino</p>
    </div>
    
    {/* ✅ [수정 2] : 위에서 지정한 id와 일치하는 div 요소를 추가합니다. */}
    <div id="ton-connect-wallet"></div>

    <div class="footer">
      {/* 문구의 오타를 수정했습니다. */}
      <p>Securely connects via TON Connect.</p>
    </div>
  </div>
`
