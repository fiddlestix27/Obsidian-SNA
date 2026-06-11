#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Obsidian SNA Plugin Setup${NC}"
echo "=================================="

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js and npm found${NC}"
echo "  Node version: $(node --version)"
echo "  npm version: $(npm --version)"
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Build the plugin
echo -e "${YELLOW}Building plugin...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Plugin built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build plugin${NC}"
    exit 1
fi
echo ""

# Check if files were created
if [ ! -f "main.js" ] || [ ! -f "manifest.json" ] || [ ! -f "styles.css" ]; then
    echo -e "${RED}✗ Build output files not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All build files created${NC}"
echo ""

# Determine OS and set plugin path
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    PLUGIN_DIR="$HOME/.obsidian/plugins/obsidian-sna"
    echo -e "${YELLOW}Detected Linux system${NC}"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    PLUGIN_DIR="$HOME/.obsidian/plugins/obsidian-sna"
    echo -e "${YELLOW}Detected macOS system${NC}"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows
    PLUGIN_DIR="$APPDATA/.obsidian/plugins/obsidian-sna"
    echo -e "${YELLOW}Detected Windows system${NC}"
else
    echo -e "${YELLOW}Could not auto-detect OS. Please enter your plugin directory path:${NC}"
    read -p "Path: " PLUGIN_DIR
fi

# Ask user for confirmation or custom path
echo ""
echo -e "${YELLOW}Plugin will be installed to:${NC}"
echo "$PLUGIN_DIR"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Installation cancelled${NC}"
    exit 0
fi

# Create plugin directory if it doesn't exist
if [ ! -d "$PLUGIN_DIR" ]; then
    echo -e "${YELLOW}Creating plugin directory...${NC}"
    mkdir -p "$PLUGIN_DIR"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Plugin directory created${NC}"
    else
        echo -e "${RED}✗ Failed to create plugin directory${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Plugin directory already exists${NC}"
fi

# Copy files
echo ""
echo -e "${YELLOW}Copying plugin files...${NC}"
cp main.js "$PLUGIN_DIR/" && echo -e "${GREEN}✓ Copied main.js${NC}"
cp manifest.json "$PLUGIN_DIR/" && echo -e "${GREEN}✓ Copied manifest.json${NC}"
cp styles.css "$PLUGIN_DIR/" && echo -e "${GREEN}✓ Copied styles.css${NC}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All files copied successfully${NC}"
else
    echo -e "${RED}✗ Failed to copy some files${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=================================="
echo "Setup Complete!"
echo "==================================${NC}"
echo ""
echo "Next steps:"
echo "1. Restart Obsidian (if it's currently open)"
echo "2. Go to Settings → Community plugins"
echo "3. Look for 'Social Network Analysis' and enable it"
echo "4. Open the graph view and use the SNA panel"
echo ""
echo "For development:"
echo "  npm run dev    - Start development build with watch mode"
echo "  npm run build  - Create production build"
echo ""
