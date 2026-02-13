#!/bin/bash

echo "================================================"
echo "QR Party Member Identification System"
echo "Installation Script for Linux/Mac"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo ""
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed!"
    echo "Please install Python 3 from your package manager"
    echo ""
    exit 1
fi

echo "Node.js version:"
node --version
echo ""

echo "Python version:"
python3 --version
echo ""

echo "================================================"
echo "Step 1: Installing root dependencies..."
echo "================================================"
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install root dependencies"
    exit 1
fi
echo "Root dependencies installed successfully!"
echo ""

echo "================================================"
echo "Step 2: Installing backend dependencies..."
echo "================================================"
cd backend
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies"
    cd ..
    exit 1
fi
cd ..
echo "Backend dependencies installed successfully!"
echo ""

echo "================================================"
echo "Step 3: Installing frontend dependencies..."
echo "================================================"
cd client
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies"
    cd ..
    exit 1
fi
cd ..
echo "Frontend dependencies installed successfully!"
echo ""

echo "================================================"
echo "Installation Complete!"
echo "================================================"
echo ""
echo "To start the system, run:"
echo "    npm start"
echo ""
echo "The system will be available at:"
echo "    Frontend: http://localhost:5173"
echo "    Backend:  http://localhost:8000"
echo ""
echo "For more information, see README.md"
echo ""
