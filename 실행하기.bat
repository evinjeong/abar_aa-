@echo off
setlocal
title ABAR 대시보드 실행기

:: 현재 디렉토리로 이동
cd /d "%~dp0"

echo ======================================================
echo   ABAR 통합 매출/매입 분석 대시보드를 시작합니다
echo ======================================================
echo.

:: Node.js 설치 확인
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org/ 에서 LTS 버전을 설치해주세요.
    pause
    exit /b
)

:: node_modules 확인 및 설치
if not exist "node_modules\" (
    echo [정보] 필요한 모듈을 설치하고 있습니다. 잠시만 기다려주세요...
    call npm install
)

:: 서버 실행 및 자동 브라우저 열기
echo [정보] 서버를 시작합니다...
echo [정보] 잠시 후 브라우저에서 대시보드가 열립니다.
echo.
echo (종료하려면 이 창을 닫거나 Ctrl+C를 누르세요)
echo ======================================================

:: npm run dev -- --open 명령어로 서버 실행 및 브라우저 열기
npm run dev -- --open

pause
endlocal
