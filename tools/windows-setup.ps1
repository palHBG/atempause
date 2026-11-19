# Atempause: one-time setup on the Windows laptop.
# Makes C:\Users\<you>\CLAUDE\code\atempause a git checkout of github.com/palHBG/atempause and
# To update later: git -C "$env:USERPROFILE\CLAUDE\code\atempause" pull
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

# 3. clean up helpers from earlier versions of this script (hourly task, desktop shortcut)
Unregister-ScheduledTask -TaskName 'Atempause Update' -Confirm:$false -ErrorAction SilentlyContinue
Remove-Item (Join-Path $dir 'tools\update-hidden.vbs'), (Join-Path $dir 'tools\update.cmd') -ErrorAction SilentlyContinue
Remove-Item (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Update Atempause.lnk') -ErrorAction SilentlyContinue

$version = (Get-Content (Join-Path $dir 'extension\manifest.json') -Raw | ConvertFrom-Json).version
Write-Host ""
Write-Host "Done. Atempause $version is in $dir"
Write-Host "To update later, in PowerShell:"
Write-Host "  git -C `"$dir`" pull"
Write-Host "In chrome://extensions load (or keep) this folder:"
Write-Host "  $dir\extension"
explorer (Join-Path $dir 'extension')
