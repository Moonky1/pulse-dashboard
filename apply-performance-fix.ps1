$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
$dashboardPath = Join-Path $projectRoot 'src\go\StudioDashboard.jsx'

if (-not (Test-Path $dashboardPath)) {
  throw "Could not find src\go\StudioDashboard.jsx"
}

$backupPath = "$dashboardPath.before-performance-fix.bak"

if (-not (Test-Path $backupPath)) {
  Copy-Item $dashboardPath $backupPath
}

$content = Get-Content $dashboardPath -Raw

$content = $content.Replace(
  "import { useEffect, useMemo, useState } from 'react'",
  "import { lazy, useEffect, useMemo, useState } from 'react'"
)

$content = [regex]::Replace(
  $content,
  "(?m)^import StudioGameBuilder from '\./StudioGameBuilder'\r?\n",
  ""
)

$content = [regex]::Replace(
  $content,
  "(?m)^import StudioGameModeSelector from '\./StudioGameModeSelector'\r?\n",
  ""
)

$content = [regex]::Replace(
  $content,
  "(?m)^import StudioMyGames from '\./StudioMyGames'\r?\n",
  ""
)

if (
  $content -notmatch "import '\./StudioPerformance\.css'"
) {
  $content = $content.Replace(
    "import './StudioOverview.css'",
    @"
import './StudioOverview.css'
import './StudioPerformance.css'

const StudioGameBuilder = lazy(() =>
  import('./StudioGameBuilder')
)

const StudioGameModeSelector = lazy(() =>
  import('./StudioGameModeSelector')
)

const StudioMyGames = lazy(() =>
  import('./StudioMyGames')
)
"@
  )
}

$content = [regex]::Replace(
  $content,
  "(?ms)\r?\n\s+if \(item\.id === 'overview'\) \{\s+refreshOverview\(\)\s+\}\s*",
  "`r`n"
)

Set-Content `
  -Path $dashboardPath `
  -Value $content `
  -Encoding utf8 `
  -NoNewline

Write-Host ''
Write-Host 'Studio performance patch applied.' -ForegroundColor Green
Write-Host "Backup: $backupPath"
Write-Host ''
Write-Host 'Now run: npm run build' -ForegroundColor Cyan
