$ErrorActionPreference = "Stop"

$browser = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path -LiteralPath $browser)) { throw "Edge is required for this local UI smoke test." }

$script:commandId = 0

function Wait-DebuggingPort([string]$Profile) {
  $marker = Join-Path $Profile "DevToolsActivePort"
  for ($retry = 0; $retry -lt 100; $retry += 1) {
    if (Test-Path -LiteralPath $marker) {
      return [int](Get-Content -LiteralPath $marker -TotalCount 1)
    }
    Start-Sleep -Milliseconds 100
  }
  throw "Edge did not open the debugging port."
}

function Invoke-Cdp($Socket, [string]$Method, $Params = @{}) {
  $script:commandId += 1
  $id = $script:commandId
  $payload = @{ id = $id; method = $Method; params = $Params } | ConvertTo-Json -Compress -Depth 8
  $sent = [System.Text.Encoding]::UTF8.GetBytes($payload)
  $Socket.SendAsync([ArraySegment[byte]]::new($sent), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null

  $cancel = [Threading.CancellationTokenSource]::new(12000)
  try {
    do {
      $buffer = [byte[]]::new(65536)
      $message = ""
      do {
        $received = $Socket.ReceiveAsync([ArraySegment[byte]]::new($buffer), $cancel.Token).GetAwaiter().GetResult()
        $message += [System.Text.Encoding]::UTF8.GetString($buffer, 0, $received.Count)
      } while (-not $received.EndOfMessage)
      $response = $message | ConvertFrom-Json
    } while ($response.id -ne $id)
  } finally {
    $cancel.Dispose()
  }
  if ($response.error) { throw "CDP $Method failed: $($response.error.message)" }
  if ($response.result.exceptionDetails) {
    $details = $response.result.exceptionDetails
    $description = if ($details.exception.description) { $details.exception.description } else { $details.text }
    throw "Page evaluation failed: $description"
  }
  return $response.result
}

function Invoke-PageValue($Socket, [string]$Expression) {
  $result = Invoke-Cdp $Socket "Runtime.evaluate" @{ expression = $Expression; returnByValue = $true; awaitPromise = $true }
  return $result.result.value
}

$tempDirectory = [IO.Path]::GetTempPath()
$profile = Join-Path $tempDirectory ("go-learning-ui-" + [guid]::NewGuid().ToString("N"))
$pagePath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..\index.html")).Path
$page = ([System.Uri]::new($pagePath)).AbsoluteUri
$process = $null
$socket = [System.Net.WebSockets.ClientWebSocket]::new()
try {
  $arguments = @("--headless=new", "--disable-gpu", "--no-first-run", "--disable-extensions", "--disable-background-mode", "--remote-debugging-port=0", "--user-data-dir=$profile", $page)
  $process = Start-Process -FilePath $browser -ArgumentList $arguments -WindowStyle Hidden -PassThru
  $port = Wait-DebuggingPort $profile
  $target = $null
  for ($retry = 0; $retry -lt 50; $retry += 1) {
    $pages = Invoke-RestMethod "http://127.0.0.1:$port/json/list"
    $target = $pages | Where-Object { $_.type -eq "page" -and $_.url.StartsWith("file:") } | Select-Object -First 1
    if ($target) { break }
    Start-Sleep -Milliseconds 100
  }
  if (-not $target) { throw "Local file page did not load." }

  $socket.ConnectAsync([System.Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
  $title = $null
  for ($retry = 0; $retry -lt 30; $retry += 1) {
    $title = Invoke-PageValue $socket "document.querySelector('#question-title')?.textContent"
    if ($title -eq "中央的一顆棋") { break }
    Start-Sleep -Milliseconds 100
  }
  if ($title -ne "中央的一顆棋") { throw "Initial dynamic lesson content did not render." }

  $shape = Invoke-PageValue $socket "({units: document.querySelector('#unit-select').options.length, shownUnits: document.querySelectorAll('.nav-unit').length, lessons: document.querySelectorAll('[data-lesson]').length})"
  if ($shape.units -ne 15 -or $shape.shownUnits -ne 1 -or $shape.lessons -ne 3) { throw "Course navigation did not render the unit selector and current unit lessons." }

  $answer = Invoke-PageValue $socket "document.querySelector('[data-lesson=`"1`"]') .click(); document.querySelector('[data-x=`"8`"][data-y=`"8`"]')?.dispatchEvent(new MouseEvent('click', {bubbles:true})); document.querySelector('[data-x=`"4`"][data-y=`"5`"]') .dispatchEvent(new MouseEvent('click', {bubbles:true})); ({feedback: document.querySelector('#feedback').textContent, events: JSON.parse(localStorage.getItem('go-learning-prototype-v7')).events.filter((event) => event.problemId === 'u1-06')})"
  if ($answer.feedback -notmatch "答對了") { throw "Board answer flow did not finish correctly." }
  if (($answer.events | ForEach-Object type) -join "," -ne "presented,answer,answer") { throw "Expected presentation and answer events were not saved." }

  Invoke-Cdp $socket "Page.reload" @{} | Out-Null
  $reloaded = $null
  for ($retry = 0; $retry -lt 30; $retry += 1) {
    Start-Sleep -Milliseconds 100
    $reloaded = Invoke-PageValue $socket "(() => { const raw = localStorage.getItem('go-learning-prototype-v7'); return {title: document.querySelector('#question-title')?.textContent, events: raw ? JSON.parse(raw).events.filter((event) => event.problemId === 'u1-06') : []}; })()"
    if ($reloaded.title -eq "中央提一顆") { break }
  }
  if ($reloaded.title -ne "中央提一顆") { throw "Page did not restore the selected lesson after reload; current title: $($reloaded.title)" }
  $interruptedCount = @($reloaded.events | Where-Object { $_.type -eq 'presentation_end' -and $_.outcome -eq 'interrupted' }).Count
  if ($interruptedCount -lt 1) { throw "Interrupted presentation was not recovered after reload: $($reloaded.events | ConvertTo-Json -Compress)" }

  $exportedCount = Invoke-PageValue $socket "(async () => { URL.createObjectURL = (blob) => { window.__eventBlob = blob; return 'blob:captured'; }; URL.revokeObjectURL = () => {}; HTMLAnchorElement.prototype.click = function () {}; document.querySelector('#export-events-button').click(); return (JSON.parse(await window.__eventBlob.text())).events.length; })()"
  if ($exportedCount -lt 4) { throw "Raw event export did not include the browser session events." }
  Write-Output "PASS: Edge loaded dynamic content, saved trial events across reload, and exported raw events."
} finally {
  if ($socket.State -eq [System.Net.WebSockets.WebSocketState]::Open) { $socket.Dispose() }
  if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
  $tempRoot = [IO.Path]::GetFullPath($tempDirectory) + [IO.Path]::DirectorySeparatorChar
  if ([IO.Path]::GetFullPath($profile).StartsWith($tempRoot)) { Remove-Item -LiteralPath $profile -Recurse -Force -ErrorAction SilentlyContinue }
}
