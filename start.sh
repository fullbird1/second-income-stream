#!/bin/bash

# Start script for Second Income Stream app
echo "Starting Second Income Stream application..."

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "MongoDB is not installed. Installing MongoDB..."
    sudo apt-get update
    sudo apt-get install -y mongodb
    sudo systemctl start mongodb
    sudo systemctl enable mongodb
    echo "MongoDB installed and started."
else
    echo "MongoDB is already installed."
    sudo systemctl start mongodb
fi

# Start backend server
echo "Starting backend server..."
cd backend
npm install
node server.js &
BACKEND_PID=$!
echo "Backend server started with PID: $BACKEND_PID"

# Wait for backend to initialize
echo "Waiting for backend to initialize..."
sleep 5

# Start frontend server
echo "Starting frontend server..."
cd ../frontend
npm install
npm start &
FRONTEND_PID=$!
echo "Frontend server started with PID: $FRONTEND_PID"

echo "Second Income Stream application is now running!"
echo "Access the application at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the application"

# Wait for user to press Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; echo 'Application stopped.'; exit" INT
wait
