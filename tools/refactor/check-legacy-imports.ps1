param(
  [string]$Root = "src/app"
)

$ErrorActionPreference = "Stop"
$files = Get-ChildItem -Path $Root -Recurse -Include *.ts,*.html,*.scss
$legacyPatterns = @(
  "src/app/components/",
  "src/app/pages/",
  "src/app/services/",
  "src/app/models/",
  "src/app/stores/",
  "src/app/layouts/",
  "src/app/pipe/",
  "src/app/utils/"
)

$violations = @()

foreach ($file in $files) {
  if ($file.FullName -replace "\\","/" -like "*/src/app/legacy/*") { continue }
  $content = Get-Content -Path $file.FullName -Raw
  foreach ($pattern in $legacyPatterns) {
    if ($content -match [regex]::Escape($pattern)) {
      $violations += "{0}: references {1}" -f ($file.FullName -replace "^.*timeTrackerNew\\",""), $pattern
    }
  }
}

if ($violations.Count -gt 0) {
  Write-Host "Legacy reference violations found:" -ForegroundColor Red
  $violations | Sort-Object -Unique | ForEach-Object { Write-Host $_ }
  exit 1
}

Write-Host "No forbidden legacy references found outside src/app/legacy." -ForegroundColor Green
