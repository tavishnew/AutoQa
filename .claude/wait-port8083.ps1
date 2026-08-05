$ErrorActionPreference = "Stop"
for ($i = 0; $i -lt 30; $i++) {
  $n = @(Get-NetTCPConnection -LocalPort 8083 -State Listen -ErrorAction SilentlyContinue).Count
  if ($n -gt 0) { Write-Output "ready in ${i}s"; exit 0 }
  Start-Sleep -Seconds 1
}
Write-Output "timeout"
exit 1
