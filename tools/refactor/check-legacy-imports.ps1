param(
  [string]$Root = "src/app"
)

$ErrorActionPreference = "Stop"
$files = Get-ChildItem -Path $Root -Recurse -Include *.ts,*.html,*.scss

# Only check for specific module filenames that were moved to legacy.
$modules = @('material.module', 'shared.module', 'stripe.module')

$violations = @()

foreach ($file in $files) {
  # skip files that are already in the legacy folder
  if ($file.FullName -replace "\\", "/" -like "*/src/app/legacy/*") { continue }

  $lines = Get-Content -Path $file.FullName
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -notmatch '^\s*import\s+') { continue }

    foreach ($module in $modules) {
      if ($line -like "*${module}*" -and $line -notlike "*legacy/*") {
        $relativePath = $file.FullName -replace "^.*timeTrackerNew\\", ""
        $violations += "{0}:{1} imports {2}" -f $relativePath, ($i + 1), $line.Trim()
      }
    }
  }
}

if ($violations.Count -gt 0) {
  Write-Host "Legacy reference violations found (non-legacy imports of moved modules):" -ForegroundColor Red
  $violations | Sort-Object -Unique | ForEach-Object { Write-Host $_ }
  exit 1
}

Write-Host "No non-legacy imports of moved modules found." -ForegroundColor Green
