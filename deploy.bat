@echo off
REM =============================================
REM StarX-Oauth 一键部署脚本 (Windows CMD)
REM =============================================
REM 用法:
REM   1. 上传代码到服务器后，双击执行此脚本
REM   2. 或在 CMD 中运行: deploy.bat
REM =============================================

setlocal enabledelayedexpansion

set APP_NAME=starx-oauth
set APP_DIR=C:\www\wwwroot\starx-oauth
set PORT=3002

echo =============================================
echo   StarX-Oauth 部署脚本
echo =============================================
echo.

REM 1. 检查 Node.js
echo [INFO] 检查 Node.js 版本...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 未安装
    pause
    exit /b 1
)
node --version

REM 2. 检查 npm
echo [INFO] 检查 npm...
npm --version

REM 3. 进入目录
cd /d "%~dp0"
echo [INFO] 当前目录: %CD%

REM 4. 安装依赖
echo [INFO] 安装依赖...
call npm install
if errorlevel 1 (
    echo [ERROR] npm install 失败
    pause
    exit /b 1
)

REM 5. 检查环境变量
echo [INFO] 检查环境变量...
if not exist ".env" (
    if exist ".env.production" (
        echo [WARN] 复制 .env.production 为 .env
        copy .env.production .env
    )
    echo [ERROR] 请先编辑 .env 文件配置必填项
    echo   - BETTER_AUTH_SECRET
    echo   - BETTER_AUTH_URL
    echo   - DATABASE_URL
    pause
    exit /b 1
)

REM 6. 数据库迁移
echo [INFO] 运行数据库迁移...
call npm run db:migration:apply

REM 7. 构建
echo [INFO] 构建项目...
call npm run build
if errorlevel 1 (
    echo [ERROR] 构建失败
    pause
    exit /b 1
)

REM 8. PM2
echo [INFO] 配置 PM2...
where pm2 >nul 2>&1
if errorlevel 1 (
    echo [INFO] 安装 PM2...
    npm install -g pm2
)

call pm2 stop %APP_NAME% 2>nul
call pm2 delete %APP_NAME% 2>nul

call pm2 start node_modules\next\dist\bin\next-start --name %APP_NAME% -- node_modules\next\dist\bin\next start -p %PORT%
call pm2 save

REM 9. 完成
echo.
echo =============================================
echo   部署完成!
echo =============================================
echo.
call pm2 status
echo.
echo 常用命令:
echo   pm2 status              - 查看状态
echo   pm2 logs %APP_NAME%  - 查看日志
echo   pm2 restart %APP_NAME% - 重启
echo.
pause
