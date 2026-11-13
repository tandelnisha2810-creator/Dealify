#!/usr/bin/env python3
"""
Setup script for Python scraper service
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and check for errors"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def main():
    """Main setup function"""
    print("🚀 Setting up Python scraper service...")

    # Install Python dependencies
    if not run_command("pip install -r requirements.txt", "Installing Python dependencies"):
        return False

    # Install Playwright browsers
    if not run_command("playwright install chromium", "Installing Playwright Chromium browser"):
        return False

    print("🎉 Setup completed successfully!")
    print("\nTo start the service:")
    print("  python app.py")
    print("\nOr with uvicorn:")
    print("  uvicorn app:app --host 0.0.0.0 --port 8000 --reload")

    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)