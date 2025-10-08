# PowerShell script to test deployed rpcProxy and direct RPC endpoints
# Usage: .\test-rpc-proxy.ps1 -siteUrl "https://your-site.pages.dev"
param(
    [Parameter(Mandatory=$true)]
    [string]$siteUrl
)

$proxyPaths = @("/functions/rpcProxy", "/api/rpcProxy")
$direct = @("https://testnet.toncenter.com/api/v2/jsonRPC", "https://net.ton.dev")

function Test-Proxy {
    param($url)
    Write-Host "Testing proxy: $url"
    $body = @{ jsonrpc='2.0'; method='net.getVersion'; params=@(); id=1 } | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 10
        Write-Host "OK: proxy returned JSON: " (ConvertTo-Json $res -Depth 2)
    } catch {
        Write-Host "FAIL: proxy request failed:`n" $_.Exception.Message
    }
}

function Test-Direct {
    param($url)
    Write-Host "Testing direct endpoint: $url"
    $body = @{ jsonrpc='2.0'; method='net.getVersion'; params=@(); id=1 } | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 10
        Write-Host "OK: direct returned JSON: " (ConvertTo-Json $res -Depth 2)
    } catch {
        Write-Host "FAIL: direct request failed:`n" $_.Exception.Message
    }
}

foreach ($p in $proxyPaths) {
    $url = $siteUrl.TrimEnd('/') + $p
    Test-Proxy -url $url
}

foreach ($d in $direct) {
    Test-Direct -url $d
}

Write-Host "Done. If proxy works but direct endpoint failed in browser, ensure your frontend uses the proxy URL in ALT list."