import csv
import psycopg2
import os
import time

# Database connection parameters
DB_NAME = os.getenv('POSTGRES_DB', 'tcss460')
DB_USER = os.getenv('POSTGRES_USER', 'tcss460')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'ads123')
DB_HOST = os.getenv('DB_HOST', 'db')

# Function to connect to PostgreSQL with retries
def connect_to_database(retries=5, delay=5):
    print("Connecting to the database...")
    for attempt in range(retries):
        try:
            conn = psycopg2.connect(
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                host=DB_HOST,
                port='5432'
            )
            print("Connected to the database!")
            return conn
        except Exception as e:
            print(f"Failed to connect to the database: {e}")
            if attempt < retries - 1:  # If this isn't the last attempt
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)  # Wait before the next attempt
            else:
                exit(1)  # Exit if unable to connect after retries

# Connect to the database
conn = connect_to_database()
cur = conn.cursor()

# Helper function to get or create an author
def get_or_create_author(name):
    print(f"Getting or creating author: {name}")
    cur.execute("SELECT author_id FROM authors WHERE name = %s;", (name,))
    author = cur.fetchone()
    if author:
        print(f"Author {name} already exists with ID: {author[0]}")
        return author[0]  
    cur.execute("INSERT INTO authors (name) VALUES (%s) RETURNING author_id;", (name,))
    conn.commit()
    new_author_id = cur.fetchone()[0]
    print(f"Created new author {name} with ID: {new_author_id}")
    return new_author_id

# Load and process data from CSV
print("Loading data from CSV...")
try:
    with open('/app/books.csv', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            print(f"Inserting book: {row['title']} with ISBN: {row['isbn13']}")
            # Insert book information without checking for duplicate ISBNs
            cur.execute("""
                INSERT INTO books (isbn13, publication_year, title, rating_avg, rating_count, image_url, image_small_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING book_id;
            """, (row['isbn13'], row['original_publication_year'], row['title'], row['average_rating'], row['ratings_count'], row['image_url'], row['small_image_url']))
            book_id = cur.fetchone()[0]
            print(f"Inserted book with ID: {book_id}")

            # Process authors for this book
            authors = [author.strip() for author in row['authors'].split(',')]
            for author_name in authors:
                author_id = get_or_create_author(author_name)
                cur.execute("""
                    INSERT INTO book_author (book_id, author_id) 
                    VALUES (%s, %s)
                    ON CONFLICT (book_id, author_id) DO NOTHING;
                """, (book_id, author_id))
            conn.commit()
except FileNotFoundError as e:
    print(f"Error: {e}")
except Exception as e:
    print(f"An error occurred while loading data: {e}")

# Close the connection
print("Closing the database connection.")
cur.close()
conn.close()

