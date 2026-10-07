const { spawnSync } = require('node:child_process');

function terminateBrowserTree(child, profile) {
  if (process.platform !== 'win32') {
    if (!child.killed) child.kill();
    return;
  }

  // Edge helpers can detach from the original process tree. First stop the tree,
  // then target only processes whose command line contains this verifier's unique
  // mkdtemp profile. Ordinary browser windows do not match and remain untouched.
  spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
  const escapedProfile = profile.replace(/'/g, "''");
  const cleanup = [
    `$targetProfile = '${escapedProfile}'`,
    'for ($pass = 0; $pass -lt 5; $pass++) {',
    '  $targets = @(Get-CimInstance Win32_Process | Where-Object {',
    "    $_.Name -in @('msedge.exe', 'chrome.exe') -and",
    '    $_.CommandLine -and',
    '    $_.CommandLine.IndexOf($targetProfile, [StringComparison]::OrdinalIgnoreCase) -ge 0',
    '  })',
    '  if ($targets.Count -eq 0) { break }',
    '  $targets | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }',
    '  Start-Sleep -Milliseconds 150',
    '}'
  ].join('\n');
  const result = spawnSync(
    'powershell.exe',
    ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', cleanup],
    { encoding: 'utf8', windowsHide: true }
  );
  if (result.error || result.status !== 0) {
    throw result.error || new Error(`Scoped browser cleanup failed: ${result.stderr.trim()}`);
  }
}

module.exports = { terminateBrowserTree };
