param(
  [Parameter(Mandatory=$true)][string]$KataGoExe,
  [Parameter(Mandatory=$true)][string]$KataGoConfig,
  [Parameter(Mandatory=$true)][string]$KataGoModel,
  [int]$Port = 8765
)

$ErrorActionPreference = "Stop"
foreach ($path in @($KataGoExe, $KataGoConfig, $KataGoModel)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing required file: $path" }
}

$env:VTCOS_KATAGO_EXE = (Resolve-Path -LiteralPath $KataGoExe).Path
$env:VTCOS_KATAGO_CONFIG = (Resolve-Path -LiteralPath $KataGoConfig).Path
$env:VTCOS_KATAGO_MODEL = (Resolve-Path -LiteralPath $KataGoModel).Path
$env:VTCOS_KATAGO_PORT = [string]$Port

$stdout = Join-Path $env:TEMP "vtcos-katago-bridge.stdout.log"
$stderr = Join-Path $env:TEMP "vtcos-katago-bridge.stderr.log"
Remove-Item $stdout,$stderr -Force -ErrorAction SilentlyContinue

$proc = Start-Process -FilePath "node.exe" -ArgumentList "katago-bridge.cjs" -WorkingDirectory (Get-Location).Path -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr
try {
  $endpoint = "http://127.0.0.1:$Port/v1/move"
  $ready = $false
  for ($i=0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 250
    if ($proc.HasExited) { throw "Bridge exited early. stderr: $(Get-Content $stderr -Raw -ErrorAction SilentlyContinue)" }
    try {
      Invoke-WebRequest -Uri $endpoint -Method Options -UseBasicParsing -TimeoutSec 2 | Out-Null
      $ready = $true; break
    } catch {}
  }
  if (-not $ready) { throw "Bridge did not become ready at $endpoint" }

  $body = @{
    contractVersion = "move-provider-v1"
    boardSize = 9
    komi = 7.5
    toPlay = 1
    initialBoard = @(
      @(0,0,0,0,0,0,0,0,0),@(0,0,0,0,0,0,0,0,0),@(0,0,0,0,0,0,0,0,0),
      @(0,0,0,0,0,0,0,0,0),@(0,0,0,0,0,0,0,0,0),@(0,0,0,0,0,0,0,0,0),
      @(0,0,0,0,0,0,0,0,0),@(0,0,0,0,0,0,0,0,0),@(0,0,0,0,0,0,0,0,0)
    )
    moves = @()
  } | ConvertTo-Json -Depth 8

  $response = Invoke-RestMethod -Uri $endpoint -Method Post -ContentType "application/json" -Body $body -TimeoutSec 60
  if ($response.providerVersion -ne "katago-gtp-bridge-v1") { throw "Unexpected providerVersion: $($response.providerVersion)" }
  if (@("play","pass","resign") -notcontains $response.type) { throw "Unexpected action type: $($response.type)" }
  if ($response.type -eq "play") {
    if (-not $response.point -or $response.point.Count -ne 2) { throw "Play action has no valid point" }
    foreach ($v in $response.point) { if ([int]$v -lt 0 -or [int]$v -ge 9) { throw "Move out of range: $($response.point -join ',')" } }
  }
  Write-Host "PASS: Windows KataGo bridge returned $($response.type); provider=$($response.providerVersion); model=$($response.model)"
  exit 0
}
finally {
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
}
