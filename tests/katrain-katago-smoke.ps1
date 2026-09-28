param(
  [string]$KaTrainConfig = (Join-Path $HOME ".katrain\config.json"),
  [string]$KaTrainRoot = "",
  [int]$Port = 8765,
  [string]$ReceiptPath = ".local-evidence\katago-smoke-receipt.json"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$programFilesX86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")

function Add-Root {
  param([System.Collections.ArrayList]$List, [string]$Value)
  if (-not $Value) { return }
  try {
    $full = [System.IO.Path]::GetFullPath([Environment]::ExpandEnvironmentVariables($Value))
    if ((Test-Path -LiteralPath $full -PathType Container) -and -not $List.Contains($full)) {
      [void]$List.Add($full)
    }
  } catch {}
}

function Get-SearchRoots {
  $roots = New-Object System.Collections.ArrayList
  if ($KaTrainRoot) {
    if (-not (Test-Path -LiteralPath $KaTrainRoot -PathType Container)) {
      throw "KaTrainRoot does not exist: $KaTrainRoot"
    }
    Add-Root $roots (Resolve-Path -LiteralPath $KaTrainRoot).Path
  }

  Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessName -match "^(KaTrain|katrain)$" } |
    ForEach-Object {
      try {
        if ($_.Path) { Add-Root $roots (Split-Path -Parent $_.Path) }
      } catch {}
    }

  foreach ($candidate in @(
    (Join-Path $env:LOCALAPPDATA "Programs\KaTrain"),
    (Join-Path $env:LOCALAPPDATA "KaTrain"),
    (Join-Path $env:APPDATA "KaTrain"),
    (if ($env:ProgramFiles) { Join-Path $env:ProgramFiles "KaTrain" }),
    (if ($programFilesX86) { Join-Path $programFilesX86 "KaTrain" })
  )) {
    Add-Root $roots $candidate
  }
  return @($roots)
}

function Find-BundledKataGo {
  param([string[]]$Roots)
  $matches = New-Object System.Collections.ArrayList
  foreach ($root in $Roots) {
    Get-ChildItem -LiteralPath $root -Filter "katago.exe" -File -Recurse -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -match "[\\/]katrain[\\/]KataGo[\\/]katago\.exe$" } |
      ForEach-Object {
        if (-not $matches.Contains($_.FullName)) { [void]$matches.Add($_.FullName) }
      }
  }
  if ($matches.Count -eq 0) { return $null }
  if ($matches.Count -gt 1) {
    throw "Found multiple bundled KataGo executables. Re-run with -KaTrainRoot pointing to exactly one KaTrain installation: $($matches -join '; ')"
  }
  return [string]$matches[0]
}

function Package-Root-From-KataGo {
  param([string]$Exe)
  if (-not $Exe) { return $null }
  $kataGoDir = Split-Path -Parent $Exe
  if ((Split-Path -Leaf $kataGoDir) -ne "KataGo") { return $null }
  $packageRoot = Split-Path -Parent $kataGoDir
  if ((Split-Path -Leaf $packageRoot) -ne "katrain") { return $null }
  return $packageRoot
}

function Expand-UserPath {
  param([string]$Value)
  $expanded = [Environment]::ExpandEnvironmentVariables($Value)
  if ($expanded -eq "~") { return $HOME }
  if ($expanded.StartsWith("~\") -or $expanded.StartsWith("~/")) {
    return Join-Path $HOME $expanded.Substring(2)
  }
  return $expanded
}

function Resolve-ConfiguredFile {
  param(
    [string]$Value,
    [string]$PackageRoot,
    [string]$ConfigDirectory,
    [string]$Label
  )
  if (-not $Value -or -not $Value.Trim()) { return $null }
  $expanded = Expand-UserPath $Value.Trim()

  if ([System.IO.Path]::IsPathRooted($expanded)) {
    if (-not (Test-Path -LiteralPath $expanded -PathType Leaf)) { throw "$Label does not exist: $expanded" }
    return (Resolve-Path -LiteralPath $expanded).Path
  }

  $normalized = $expanded.Replace("/", "\")
  if ($normalized -match "^katrain\\(.+)$") {
    if (-not $PackageRoot) { throw "$Label is package-relative but KaTrain package root was not found: $Value" }
    $candidate = Join-Path $PackageRoot $Matches[1]
    if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { throw "$Label does not exist: $candidate" }
    return (Resolve-Path -LiteralPath $candidate).Path
  }

  $relativeCandidate = Join-Path $ConfigDirectory $expanded
  if (-not (Test-Path -LiteralPath $relativeCandidate -PathType Leaf)) { throw "$Label does not exist: $relativeCandidate" }
  return (Resolve-Path -LiteralPath $relativeCandidate).Path
}

if (-not (Test-Path -LiteralPath $KaTrainConfig -PathType Leaf)) {
  throw "KaTrain user config was not found at $KaTrainConfig. Start KaTrain once, or pass -KaTrainConfig with the correct config.json path."
}

$configPath = (Resolve-Path -LiteralPath $KaTrainConfig).Path
$configDirectory = Split-Path -Parent $configPath
try {
  $config = Get-Content -LiteralPath $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
  throw "KaTrain config could not be parsed: $($_.Exception.Message)"
}
if (-not $config.engine) { throw "KaTrain config has no engine section: $configPath" }

$roots = Get-SearchRoots
$configuredExe = [string]$config.engine.katago
$exe = $null
$packageRoot = $null

if ($configuredExe -and $configuredExe.Trim()) {
  $expandedExe = Expand-UserPath $configuredExe.Trim()
  if ([System.IO.Path]::IsPathRooted($expandedExe)) {
    if (-not (Test-Path -LiteralPath $expandedExe -PathType Leaf)) { throw "Configured KataGo executable does not exist: $expandedExe" }
    $exe = (Resolve-Path -LiteralPath $expandedExe).Path
    $packageRoot = Package-Root-From-KataGo $exe
  } elseif ($expandedExe.Replace("/", "\") -match "^katrain\\KataGo\\katago\.exe$") {
    $exe = Find-BundledKataGo $roots
    if (-not $exe) { throw "KaTrain uses bundled KataGo, but no bundled katrain\KataGo\katago.exe was found. Re-run with -KaTrainRoot." }
    $packageRoot = Package-Root-From-KataGo $exe
  } else {
    throw "KaTrain engine.katago is a relative custom path that cannot be resolved safely: $configuredExe"
  }
} else {
  $exe = Find-BundledKataGo $roots
  if (-not $exe) { throw "KaTrain uses bundled KataGo, but no bundled katrain\KataGo\katago.exe was found. Re-run with -KaTrainRoot." }
  $packageRoot = Package-Root-From-KataGo $exe
}

if (-not $packageRoot) {
  $bundled = Find-BundledKataGo $roots
  if ($bundled) { $packageRoot = Package-Root-From-KataGo $bundled }
}

$configFile = Resolve-ConfiguredFile ([string]$config.engine.config) $packageRoot $configDirectory "KataGo config"
$modelFile = Resolve-ConfiguredFile ([string]$config.engine.model) $packageRoot $configDirectory "KataGo model"
if (-not $configFile) { throw "KaTrain engine.config is empty; cannot run a reproducible smoke." }
if (-not $modelFile) { throw "KaTrain engine.model is empty; cannot run a reproducible smoke." }

Write-Host "KaTrain config: $configPath"
Write-Host "KataGo executable: $exe"
Write-Host "KataGo config: $configFile"
Write-Host "KataGo model: $modelFile"
Write-Host "Starting the repository smoke contract..."

& (Join-Path $PSScriptRoot "katago-bridge-smoke.ps1") -KataGoExe $exe -KataGoConfig $configFile -KataGoModel $modelFile -Port $Port -ReceiptPath $ReceiptPath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
