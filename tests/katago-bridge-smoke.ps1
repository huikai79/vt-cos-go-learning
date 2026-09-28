param(
  [Parameter(Mandatory=$true)][string]$KataGoExe,
  [Parameter(Mandatory=$true)][string]$KataGoConfig,
  [Parameter(Mandatory=$true)][string]$KataGoModel,
  [int]$Port = 8765,
  [string]$ReceiptPath = ".local-evidence\katago-smoke-receipt.json"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
Set-Location -LiteralPath $repoRoot

foreach ($pathValue in @($KataGoExe, $KataGoConfig, $KataGoModel)) {
  if (-not (Test-Path -LiteralPath $pathValue -PathType Leaf)) { throw "Missing required file: $pathValue" }
}

$resolvedExe = (Resolve-Path -LiteralPath $KataGoExe).Path
$resolvedConfig = (Resolve-Path -LiteralPath $KataGoConfig).Path
$resolvedModel = (Resolve-Path -LiteralPath $KataGoModel).Path

$versionOutput = & $resolvedExe version 2>&1
if ($LASTEXITCODE -ne 0) { throw "KataGo version command failed: $($versionOutput -join ' ')" }
$engineVersion = (($versionOutput | ForEach-Object { [string]$_ } | Where-Object { $_.Trim() } | Select-Object -First 1).Trim())
if (-not $engineVersion) { throw "KataGo version command returned no version text" }

$repoCommit = (& git -C $repoRoot rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $repoCommit -notmatch '^[0-9a-fA-F]{40}$') { throw "Could not determine repository commit for smoke receipt" }
$trackedChanges = (& git -C $repoRoot status --porcelain --untracked-files=no)
if ($LASTEXITCODE -ne 0) { throw "Could not inspect repository state for smoke receipt" }
if ($trackedChanges) { throw "Tracked repository files are modified. Run the smoke on a clean checkout so the receipt can be tied to one commit." }

$receiptFullPath = if ([System.IO.Path]::IsPathRooted($ReceiptPath)) { $ReceiptPath } else { Join-Path $repoRoot $ReceiptPath }
$receiptDir = Split-Path -Parent $receiptFullPath
if ($receiptDir -and -not (Test-Path -LiteralPath $receiptDir)) { New-Item -ItemType Directory -Path $receiptDir -Force | Out-Null }
Remove-Item -LiteralPath $receiptFullPath -Force -ErrorAction SilentlyContinue

$env:VTCOS_KATAGO_EXE = $resolvedExe
$env:VTCOS_KATAGO_CONFIG = $resolvedConfig
$env:VTCOS_KATAGO_MODEL = $resolvedModel
$env:VTCOS_KATAGO_ENGINE_VERSION = $engineVersion
$env:VTCOS_KATAGO_PORT = [string]$Port

$stdout = Join-Path $env:TEMP "vtcos-katago-bridge.stdout.log"
$stderr = Join-Path $env:TEMP "vtcos-katago-bridge.stderr.log"
Remove-Item $stdout,$stderr -Force -ErrorAction SilentlyContinue

$proc = Start-Process -FilePath "node.exe" -ArgumentList "katago-bridge.cjs" -WorkingDirectory $repoRoot -PassThru -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr
try {
  $moveEndpoint = "http://127.0.0.1:$Port/v1/move"
  $ready = $false
  for ($i=0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 250
    if ($proc.HasExited) { throw "Bridge exited early. stderr: $(Get-Content $stderr -Raw -ErrorAction SilentlyContinue)" }
    try {
      Invoke-WebRequest -Uri $moveEndpoint -Method Options -UseBasicParsing -TimeoutSec 2 | Out-Null
      $ready = $true
      break
    } catch {}
  }
  if (-not $ready) { throw "Bridge did not become ready at $moveEndpoint" }

  $moveBody = @{
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

  $moveResponse = Invoke-RestMethod -Uri $moveEndpoint -Method Post -ContentType "application/json" -Body $moveBody -TimeoutSec 60
  if ($moveResponse.providerVersion -ne "katago-gtp-bridge-v1") { throw "Unexpected providerVersion: $($moveResponse.providerVersion)" }
  if (@("play","pass","resign") -notcontains $moveResponse.type) { throw "Unexpected action type: $($moveResponse.type)" }
  if ($moveResponse.type -eq "play") {
    if (-not $moveResponse.point -or $moveResponse.point.Count -ne 2) { throw "Play action has no valid point" }
    foreach ($value in $moveResponse.point) {
      if ([int]$value -lt 0 -or [int]$value -ge 9) { throw "Move out of range: $($moveResponse.point -join ',')" }
    }
  }
  Write-Host "PASS: Windows KataGo move bridge returned $($moveResponse.type); provider=$($moveResponse.providerVersion); model=$($moveResponse.model)"

  $compareEndpoint = "http://127.0.0.1:$Port/v1/compare"
  $compareRequest = [ordered]@{
    contractVersion = "decision-comparison-provider-v1"
    comparisonContractVersion = "decision-point-comparison-v1"
    requestId = "windows-smoke-comparison"
    sourceId = "windows-smoke-sgf"
    positionFingerprint = "windows-smoke-position"
    boardSize = 19
    toPlay = 1
    rules = "japanese"
    komi = 6.5
    maxVisits = 100
    analysisPVLen = 8
    historyMode = "root_setup_plus_moves"
    initialStones = @()
    moves = @(
      [ordered]@{ color = 1; type = "play"; point = @(15,3) },
      [ordered]@{ color = 2; type = "play"; point = @(3,3) }
    )
    candidates = @(
      [ordered]@{ role = "learner_first"; point = @(4,4) },
      [ordered]@{ role = "original_game"; point = @(16,15) }
    )
    authority = "bounded_search_estimate_only"
    formalEligible = $false
  }
  $compareBody = $compareRequest | ConvertTo-Json -Depth 8
  $comparison = Invoke-RestMethod -Uri $compareEndpoint -Method Post -ContentType "application/json" -Body $compareBody -TimeoutSec 90

  if ($comparison.resultVersion -ne "decision-comparison-result-v1") { throw "Unexpected comparison resultVersion: $($comparison.resultVersion)" }
  if ($comparison.providerVersion -ne "katago-analysis-comparison-v1") { throw "Unexpected comparison providerVersion: $($comparison.providerVersion)" }
  if ($comparison.authority -ne "bounded_search_estimate_only") { throw "Unexpected comparison authority: $($comparison.authority)" }
  if ($comparison.formalEligible -ne $false) { throw "Comparison must remain formalEligible=false" }
  if ($comparison.engineVersion -ne $engineVersion) { throw "Comparison engine version mismatch: expected $engineVersion, got $($comparison.engineVersion)" }
  if (-not $comparison.candidates -or $comparison.candidates.Count -ne 2) { throw "Comparison did not return exactly two candidates" }
  $roles = @($comparison.candidates | ForEach-Object { $_.role })
  if ($roles -notcontains "learner_first" -or $roles -notcontains "original_game") { throw "Comparison candidate roles are incomplete: $($roles -join ',')" }
  foreach ($candidate in $comparison.candidates) {
    if ($null -eq $candidate.order -or $null -eq $candidate.visits) { throw "Comparison candidate lacks order/visits" }
  }
  Write-Host "PASS: Windows KataGo comparison returned both bounded candidates; provider=$($comparison.providerVersion); engine=$($comparison.engineVersion); model=$($comparison.model)"

  $contractFiles = [ordered]@{}
  foreach ($relativePath in @(
    "katago-bridge.cjs",
    "decision-comparison.js",
    "katago-comparison-adapter.cjs",
    "katago-smoke-receipt.cjs",
    "tests/katago-bridge-smoke.ps1"
  )) {
    $absolutePath = Join-Path $repoRoot $relativePath
    $contractFiles[$relativePath] = (Get-FileHash -LiteralPath $absolutePath -Algorithm SHA256).Hash.ToLowerInvariant()
  }

  $normalizedMovePoint = $null
  if ($moveResponse.type -eq "play") {
    $normalizedMovePoint = @([int]$moveResponse.point[0], [int]$moveResponse.point[1])
  }

  $receipt = [ordered]@{
    schemaVersion = 1
    receiptVersion = "katago-windows-smoke-receipt-v1"
    status = "PASS"
    generatedAt = (Get-Date).ToUniversalTime().ToString("o")
    platform = "windows"
    repositoryCommit = $repoCommit.ToLowerInvariant()
    contractFiles = $contractFiles
    runtime = [ordered]@{
      powershellVersion = $PSVersionTable.PSVersion.ToString()
      nodeVersion = ((& node --version) | Out-String).Trim()
      osVersion = [System.Environment]::OSVersion.VersionString
    }
    engine = [ordered]@{
      version = $engineVersion
      executableName = [System.IO.Path]::GetFileName($resolvedExe)
      executableSha256 = (Get-FileHash -LiteralPath $resolvedExe -Algorithm SHA256).Hash.ToLowerInvariant()
      configName = [System.IO.Path]::GetFileName($resolvedConfig)
      configSha256 = (Get-FileHash -LiteralPath $resolvedConfig -Algorithm SHA256).Hash.ToLowerInvariant()
      modelName = [System.IO.Path]::GetFileName($resolvedModel)
      modelSha256 = (Get-FileHash -LiteralPath $resolvedModel -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    moveResult = [ordered]@{
      providerVersion = [string]$moveResponse.providerVersion
      model = [string]$moveResponse.model
      type = [string]$moveResponse.type
      point = $normalizedMovePoint
    }
    comparisonRequest = $compareRequest
    comparisonResult = $comparison
  }

  $receipt | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $receiptFullPath -Encoding UTF8
  & node (Join-Path $repoRoot "scripts\verify-katago-smoke-receipt.cjs") $receiptFullPath
  if ($LASTEXITCODE -ne 0) {
    Remove-Item -LiteralPath $receiptFullPath -Force -ErrorAction SilentlyContinue
    throw "Generated KataGo smoke receipt failed repository verification"
  }

  Write-Host "PASS: verified receipt written to $receiptFullPath"
  exit 0
}
finally {
  if ($proc -and -not $proc.HasExited) { Stop-Process -Id $proc.Id -Force }
}
