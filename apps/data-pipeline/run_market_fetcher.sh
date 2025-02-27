#!/bin/bash

# Run Market Data Fetcher with configurable options
# This script provides an easy way to run the market data fetcher with various modes

# Default values
TEST_MODE="false"
DEMO_MODE="false"
SHOW_USAGE="false"
PYTHON_CMD="python3"

# Parse command line options
while [[ $# -gt 0 ]]; do
  case "$1" in
    --test)
      TEST_MODE="true"
      shift
      ;;
    --demo)
      DEMO_MODE="true"
      shift
      ;;
    --python3.13)
      PYTHON_CMD="python3.13"
      shift
      ;;
    --help|-h)
      SHOW_USAGE="true"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      SHOW_USAGE="true"
      shift
      ;;
  esac
done

# Show usage if requested
if [ "$SHOW_USAGE" = "true" ]; then
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --test       Run in test mode (fetch data but don't insert into database)"
  echo "  --demo       Run in demo mode (use simulated data instead of real API calls)"
  echo "  --python3.13 Use Python 3.13 instead of default Python 3"
  echo "  --help, -h   Show this help message"
  exit 0
fi

# Export environment variables
export TEST_MODE=$TEST_MODE
export DEMO_MODE=$DEMO_MODE

echo "Running market data fetcher with:"
echo "  TEST_MODE: $TEST_MODE"
echo "  DEMO_MODE: $DEMO_MODE"
echo "  Python:    $PYTHON_CMD"
echo ""

# Run the market data fetcher
$PYTHON_CMD market_data_fetcher_final.py

# Exit with the status of the Python script
exit $? 