$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = [IO.Path]::GetFullPath((Resolve-Path (Join-Path $PSScriptRoot "..")).Path)
$gitRoot = [IO.Path]::GetFullPath((git -C $projectRoot rev-parse --show-toplevel).Trim())
if ($LASTEXITCODE -ne 0 -or $gitRoot -ne $projectRoot) {
    throw "Git root must be exactly the project root: $projectRoot"
}

$trackedEntries = @(git -C $projectRoot ls-files --stage)
if ($LASTEXITCODE -ne 0) { throw "Unable to inspect tracked Git entries." }
$trackedPaths = @(git -C $projectRoot ls-files)
if ($LASTEXITCODE -ne 0) { throw "Unable to inspect tracked Git paths." }
$manifest = Get-Content -Raw -LiteralPath (Join-Path $projectRoot "release-manifest.json") | ConvertFrom-Json
$manifestPaths = @($manifest.publicFiles | Sort-Object)
$trackedPaths = @($trackedPaths | Sort-Object)
$manifestDiff = @(Compare-Object -ReferenceObject $manifestPaths -DifferenceObject $trackedPaths)
if ($manifestDiff.Count -gt 0) {
    throw "Tracked files must exactly match release-manifest.json: $($manifestDiff | Out-String)"
}

$unsafeGitEntries = @($trackedEntries | Where-Object { $_ -match '^(120000|160000) ' })
if ($unsafeGitEntries.Count -gt 0) {
    throw "Tracked symbolic links or submodules are not allowed: $($unsafeGitEntries -join '; ')"
}
if (Test-Path -LiteralPath (Join-Path $projectRoot ".gitmodules")) {
    throw ".gitmodules is not allowed in this standalone static release."
}

$gitMetadataPrefix = [IO.Path]::GetFullPath((Join-Path $projectRoot ".git")) + [IO.Path]::DirectorySeparatorChar
$reparsePoints = @(Get-ChildItem -LiteralPath $projectRoot -Force -Recurse -Attributes ReparsePoint -ErrorAction Stop |
    Where-Object { -not ([IO.Path]::GetFullPath($_.FullName).StartsWith($gitMetadataPrefix, [StringComparison]::OrdinalIgnoreCase)) })
if ($reparsePoints.Count -gt 0) {
    throw "Filesystem links or reparse points are not allowed: $($reparsePoints.FullName -join '; ')"
}

$workflowRoot = Join-Path $projectRoot ".github\workflows"
$workflowFiles = @(if (Test-Path -LiteralPath $workflowRoot) { Get-ChildItem -LiteralPath $workflowRoot -File -Recurse })
$workflowSecretReferences = 0
if ($workflowFiles.Count -gt 0) {
    foreach ($workflow in $workflowFiles) {
        $content = Get-Content -Raw -LiteralPath $workflow.FullName
        if ($content -match '(?m)^\s*pull_request_target\s*:') { throw "$($workflow.FullName) uses pull_request_target." }
        if ($content -match '(?m)^\s*permissions\s*:\s*write-all\s*$') { throw "$($workflow.FullName) uses write-all permissions." }
        $workflowSecretReferences += [regex]::Matches($content, 'secrets\.[A-Za-z_][A-Za-z0-9_]*').Count
        foreach ($uses in [regex]::Matches($content, '(?m)^\s*-?\s*uses\s*:\s*([^\s#]+)')) {
            $reference = $uses.Groups[1].Value
            $isLocalOrContainer = $reference.StartsWith("./") -or $reference.StartsWith("docker://")
            if (-not $isLocalOrContainer -and $reference -notmatch '@[0-9a-fA-F]{40}$') {
                throw "$($workflow.FullName) has an unpinned external action: $reference"
            }
        }
    }
}

$dependabotFiles = @(@(
    ".github\dependabot.yml",
    ".github\dependabot.yaml"
) | ForEach-Object { Join-Path $projectRoot $_ } | Where-Object { Test-Path -LiteralPath $_ })
if ($dependabotFiles.Count -gt 1) { throw "Only one Dependabot configuration file is allowed." }

[pscustomobject]@{
    GitRoot = $gitRoot
    ManifestFiles = $manifestPaths.Count
    TrackedEntries = $trackedEntries.Count
    Workflows = $workflowFiles.Count
    WorkflowSecretReferences = $workflowSecretReferences
    DependabotConfigs = $dependabotFiles.Count
    SubmodulesOrSymlinks = $unsafeGitEntries.Count
    ReparsePoints = $reparsePoints.Count
} | Format-List
Write-Output "PASS: repository boundary, link and workflow audit"
