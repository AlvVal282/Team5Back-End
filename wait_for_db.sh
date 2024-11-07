#!/bin/bash

# Wait for PostgreSQL to be ready
until pg_isready -h db -U tcss460; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Wait for the `books` table to be created
until PGPASSWORD="$POSTGRES_PASSWORD" psql -h db -U tcss460 -d tcss460 -c "SELECT to_regclass('public.books');" | grep -q 'books'; do
  echo "Waiting for the 'books' table to be created..."
  sleep 2
done

# Run the data loading script
python3 /app/load_data.py

