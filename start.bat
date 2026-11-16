@echo off
cd /d "%~dp0"

rem Port checks use PowerShell (a single process, no pipe) instead of
rem "netstat | findstr | findstr" - this machine runs a fastfetch banner
rem on every new cmd.exe window (see HKCU\...\Command Processor\AutoRun),
rem and each stage of a piped command spawns its own nested cmd.exe, which
rem re-triggers that banner. Inside the 1-second wait loop below that
rem happened every second, flooding the window and making the script look
rem stuck instead of ever reaching the "open the browser" step.
call :port_open
if %errorlevel%==0 (
    start "" http://localhost:5500
    exit /b
)

rem http-server (not python -m http.server) - it actually serves Range
rem requests (206 Partial Content), which is what lets the native <video>
rem controls seek/scrub at all. Python's http.server always returns the
rem full file with 200 regardless of a Range header, so every seek
rem silently snaps back to 0:00 - looked like a broken player, but it was
rem only ever a limitation of this local dev server.
start "isekaico server" /min cmd /c "npx --yes http-server -p 5500 -c-1"

:waitloop
timeout /t 1 /nobreak >nul
call :port_open
if not %errorlevel%==0 goto waitloop

start "" http://localhost:5500
exit /b

:port_open
powershell -NoProfile -Command "try { (New-Object System.Net.Sockets.TcpClient('127.0.0.1', 5500)).Close(); exit 0 } catch { exit 1 }"
exit /b %errorlevel%