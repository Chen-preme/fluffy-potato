@echo off
echo 正在启动项目...
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查MongoDB是否运行
echo 检查MongoDB状态...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo 启动MongoDB...
    start "MongoDB" node start-mongo.js
    timeout /t 3 /nobreak >nul
)

REM 安装依赖（如果需要）
if not exist node_modules (
    echo 安装项目依赖...
    npm install
)

REM 启动项目
echo 启动Web服务器...
node index.js

pause