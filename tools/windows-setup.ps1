# Atempause: one-time setup on the Windows laptop.
# Makes C:\Users\<you>\CLAUDE\code\atempause a git checkout of github.com/palHBG/atempause and
# registers a hidden scheduled task that pulls updates at logon and every hour.
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

# 3. hidden updater (wscript runs git without a console window popping up)
$vbs = Join-Path $dir 'tools\update-hidden.vbs'
@"
CreateObject("WScript.Shell").Run """$git"" -C ""$dir"" pull -q --ff-only", 0, True
"@ | Set-Content -Encoding ASCII $vbs

$action   = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$vbs`""
$atLogon  = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$hourly   = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName 'Atempause Update' -Action $action -Trigger $atLogon, $hourly `
    -Settings $settings -Description 'Pulls the Atempause Chrome extension from GitHub' -Force | Out-Null

$version = (Get-Content (Join-Path $dir 'extension\manifest.json') -Raw | ConvertFrom-Json).version
Write-Host ""
Write-Host "Done. Atempause $version is in $dir"
Write-Host "Updates are pulled at logon and every hour (task 'Atempause Update')."
Write-Host "In chrome://extensions load (or keep) this folder:"
Write-Host "  $dir\extension"
explorer (Join-Path $dir 'extension')
