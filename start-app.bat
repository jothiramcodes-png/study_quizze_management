@echo off
echo 🚀 Starting MindTrack AI application...

:: Start Backend Server
echo 📂 Launching backend server in a new window...
start cmd /k "cd server && npm run dev"

:: Start Frontend Client
echo 📂 Launching frontend client in a new window...
start cmd /k "cd client && npm run dev"

echo Done! Both services are starting.
pause
