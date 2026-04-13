@echo off
echo ==============================================
echo   NexaBank - Full Stack Banking Platform
echo ==============================================
echo.
echo [1/2] Starting Backend API on port 5000...
start "NexaBank API" cmd /k "cd /d d:\Projects\BANKWEB\server && node server.js"
timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend on port 5173...
start "NexaBank Frontend" cmd /k "cd /d d:\Projects\BANKWEB && npm run dev"
timeout /t 3 /nobreak > nul

echo.
echo =============================================
echo  Both servers are starting...
echo.
echo  Frontend : http://localhost:5173
echo  API Docs : http://localhost:5000/api/health
echo  MongoDB  : MongoDB Atlas (Cloud)
echo =============================================
echo.
echo  Make sure MongoDB is running first!
echo  Run: mongod
echo.
pause
