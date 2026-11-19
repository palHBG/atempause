# Atempause: one-time setup on the Windows laptop.
# Makes C:\Users\<you>\CLAUDE\code\atempause a git checkout of github.com/palHBG/atempause and
# puts an "Update Atempause" shortcut on the desktop that pulls the latest version on demand.
# The extension notices the new version on disk and reloads itself.
#
# Run in PowerShell:
#   irm https://raw.githubusercontent.com/palHBG/atempause/main/tools/windows-setup.ps1 | iex

$ErrorActionPreference = 'Stop'
$repo = 'https://github.com/palHBG/atempause.git'
$dir  = Join-Path $env:USERPROFILE 'CLAUDE\code\atempause'

# 1. git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host 'Installing Git ...'
    winget install --id Git.Git -e --silent --accept-package-agreements --accept-source-agreements
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}
$git = (Get-Command git).Source

# 2. checkout in place (keeps the folder path, so Chrome keeps pointing at it)
New-Item -ItemType Directory -Force (Split-Path $dir) | Out-Null
if (-not (Test-Path (Join-Path $dir '.git'))) {
    New-Item -ItemType Directory -Force $dir | Out-Null
    & $git -C $dir init -q -b main
    & $git -C $dir remote add origin $repo
}
& $git -C $dir fetch -q origin main
& $git -C $dir checkout -q -f -B main origin/main

# 3. on-demand updater: desktop shortcut "Update Atempause" (no scheduled task)
Unregister-ScheduledTask -TaskName 'Atempause Update' -Confirm:$false -ErrorAction SilentlyContinue
$cmd = Join-Path $dir 'tools\update.cmd'
@"
@echo off
echo Updating Atempause ...
"$git" -C "$dir" pull --ff-only
echo.
echo Done. Chrome picks up the new version within a minute.
timeout /t 4 >nul
"@ | Set-Content -Encoding ASCII $cmd
$lnk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Update Atempause.lnk'
$sc = (New-Object -ComObject WScript.Shell).CreateShortcut($lnk)
$sc.TargetPath = $cmd
$sc.WorkingDirectory = $dir
$sc.IconLocation = Join-Path $dir 'extension\icons\atempause.ico'
$sc.Save()

$version = (Get-Content (Join-Path $dir 'extension\manifest.json') -Raw | ConvertFrom-Json).version
Write-Host ""
Write-Host "Done. Atempause $version is in $dir"
Write-Host "To update later: double-click 'Update Atempause' on the desktop."
Write-Host "In chrome://extensions load (or keep) this folder:"
Write-Host "  $dir\extension"
explorer (Join-Path $dir 'extension')
