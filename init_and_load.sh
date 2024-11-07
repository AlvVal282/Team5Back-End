#!/bin/bash

# Run the SQL file to create tables
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/init.sql

# Wait for a few seconds to ensure PostgreSQL is ready for further operations
sleep 5

# Run the Python script to populate data
python3 /docker-entrypoint-initdb.d/load_data.py
