#!/bin/bash

# Script to run the data pipeline with proper Python environment

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Process command line arguments
USE_LITE=false
ARGS=()

for arg in "$@"; do
    if [ "$arg" == "--lite" ]; then
        USE_LITE=true
    else
        ARGS+=("$arg")
    fi
done

# Run the appropriate scheduler with any arguments passed to this script
if [ "$USE_LITE" = true ]; then
    echo "Running simplified scheduler..."
    # For lite version, use system Python directly
    python3 main_scheduler_lite.py "${ARGS[@]}"
else
    echo "Running full scheduler..."
    # For full version, set up virtual environment if needed
    if [ ! -d "venv" ]; then
        echo "Setting up virtual environment..."
        python3 -m venv venv
        source venv/bin/activate
        pip install python-dotenv schedule pandas-datareader setuptools
    else
        source venv/bin/activate
    fi
    
    # Run with virtual environment
    python3 main_scheduler.py "${ARGS[@]}"
fi 