$ErrorActionPreference = "Stop"

$wrapper = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "katrain-katago-smoke.ps1")).Path
$tempRoot = Join-Path $env:TEMP ("vtcos-katrain-discovery-" + [Guid]::NewGuid().ToString("N"))

try {
  $appRoot = Join-Path $tempRoot "KaTrainApp"
  $packageRoot = Join-Path $appRoot "_internal\katrain"
  $kataGoDir = Join-Path $packageRoot "KataGo"
  $modelDir = Join-Path $packageRoot "models"
  $userDir = Join-Path $tempRoot ".katrain"

  New-Item -ItemType Directory -Force -Path $kataGoDir,$modelDir,$userDir | Out-Null
  Set-Content -LiteralPath (Join-Path $kataGoDir "katago.exe") -Value "exe-fixture" -Encoding Ascii
  Set-Content -LiteralPath (Join-Path $kataGoDir "analysis_config.cfg") -Value "config-fixture" -Encoding Ascii
  Set-Content -LiteralPath (Join-Path $modelDir "fixture-model.bin.gz") -Value "model-fixture" -Encoding Ascii

  @{
    engine = @{
      katago = ""
      config = "katrain/KataGo/analysis_config.cfg"
      model = "katrain/models/fixture-model.bin.gz"
    }
  } | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $userDir "config.json") -Encoding UTF8

  $json = & $wrapper -KaTrainConfig (Join-Path $userDir "config.json") -KaTrainRoot $appRoot -ResolveOnly
  $resolved = $json | ConvertFrom-Json

  if (-not (Test-Path -LiteralPath $resolved.kataGoExe -PathType Leaf)) { throw "resolved bundled exe does not exist" }
  if (-not (Test-Path -LiteralPath $resolved.kataGoConfig -PathType Leaf)) { throw "resolved bundled config does not exist" }
  if (-not (Test-Path -LiteralPath $resolved.kataGoModel -PathType Leaf)) { throw "resolved bundled model does not exist" }

  if ((Get-Content -LiteralPath $resolved.kataGoExe -Raw).Trim() -ne "exe-fixture") { throw "bundled exe resolution mismatch" }
  if ((Get-Content -LiteralPath $resolved.kataGoConfig -Raw).Trim() -ne "config-fixture") { throw "bundled config resolution mismatch" }
  if ((Get-Content -LiteralPath $resolved.kataGoModel -Raw).Trim() -ne "model-fixture") { throw "bundled model resolution mismatch" }

  if ($resolved.kataGoExe -notmatch "[\\/]katrain[\\/]KataGo[\\/]katago\.exe$") { throw "bundled exe suffix mismatch" }
  if ($resolved.kataGoConfig -notmatch "[\\/]katrain[\\/]KataGo[\\/]analysis_config\.cfg$") { throw "bundled config suffix mismatch" }
  if ($resolved.kataGoModel -notmatch "[\\/]katrain[\\/]models[\\/]fixture-model\.bin\.gz$") { throw "bundled model suffix mismatch" }

  $secondPackage = Join-Path $appRoot "second\katrain\KataGo"
  New-Item -ItemType Directory -Force -Path $secondPackage | Out-Null
  Set-Content -LiteralPath (Join-Path $secondPackage "katago.exe") -Value "fixture" -Encoding Ascii

  $ambiguousFailed = $false
  try {
    & $wrapper -KaTrainConfig (Join-Path $userDir "config.json") -KaTrainRoot $appRoot -ResolveOnly | Out-Null
  } catch {
    $ambiguousFailed = $_.Exception.Message -match "multiple bundled KataGo executables"
  }
  if (-not $ambiguousFailed) { throw "ambiguous bundled KataGo discovery did not fail closed" }

  Write-Host "PASS: KaTrain smoke autodiscovery resolves one bundle and rejects ambiguity"
}
finally {
  Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
}
