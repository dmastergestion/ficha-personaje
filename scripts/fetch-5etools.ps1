# Descarga solo la carpeta data/ de 5etools-src (gitignored en vendor/)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$dest = Join-Path $root "vendor\5etools-src"

if (Test-Path $dest) {
  Write-Host "Actualizando vendor/5etools-src..."
  Push-Location $dest
  git pull --depth 1 2>$null
  git sparse-checkout set data
  Pop-Location
} else {
  Write-Host "Clonando 5etools-src (solo data/)..."
  git clone --depth 1 --filter=blob:none --sparse `
    https://github.com/5etools-mirror-3/5etools-src.git $dest
  Push-Location $dest
  git sparse-checkout set data
  Pop-Location
}

Write-Host "Listo: $dest\data"
