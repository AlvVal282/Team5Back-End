-- Drop existing tables if they exist
DROP TABLE IF EXISTS Book_Ratings CASCADE;
DROP TABLE IF EXISTS Book_Author CASCADE;
DROP TABLE IF EXISTS Authors CASCADE;
DROP TABLE IF EXISTS Books CASCADE;
DROP TABLE IF EXISTS Account_Credential CASCADE;
DROP TABLE IF EXISTS Account CASCADE;
DROP TABLE IF EXISTS Account_Role CASCADE;

-- Account Roles Table
CREATE TABLE Account_Role (
    Role_ID SERIAL PRIMARY KEY,
    Role_Name VARCHAR(50) NOT NULL
);

-- Insert predefined roles into Account_Role table
INSERT INTO Account_Role (Role_Name)
VALUES
    ('Admin'),
    ('Manager'),
    ('Developer'),
    ('Account User'),
    ('Anonymous User');

-- Accounts Table
CREATE TABLE Account (
    Account_ID SERIAL PRIMARY KEY,
    FirstName VARCHAR(255) NOT NULL,
    LastName VARCHAR(255) NOT NULL,
    Username VARCHAR(255) NOT NULL UNIQUE,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Phone VARCHAR(15) NOT NULL UNIQUE,
    Account_Role INT NOT NULL,
    FOREIGN KEY (Account_Role) REFERENCES Account_Role(Role_ID)
);

-- Account Credentials Table 
CREATE TABLE Account_Credential (
    Credential_ID SERIAL PRIMARY KEY,
    Account_ID INT NOT NULL,
    Salted_Hash VARCHAR(255) NOT NULL,
    Salt VARCHAR(255),
    CONSTRAINT account_credential_account_id_fkey FOREIGN KEY (Account_ID) REFERENCES account(Account_ID) ON DELETE CASCADE
);


-- Authors Table 
CREATE TABLE Authors (
    Author_ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL UNIQUE
);

-- Books Table
CREATE TABLE Books (
    Book_ID SERIAL PRIMARY KEY,
    ISBN13 BIGINT UNIQUE NOT NULL,
    Publication_Year INT,
    Title TEXT NOT NULL,
    Rating_Avg FLOAT,
    Rating_Count INT,
    Image_URL TEXT,
    Image_Small_URL TEXT
);

-- Table for Books and Authors
CREATE TABLE Book_Author (
    Book_ID INT NOT NULL,
    Author_ID INT NOT NULL,
    PRIMARY KEY (Book_ID, Author_ID),
    FOREIGN KEY (Book_ID) REFERENCES Books(Book_ID) ON DELETE CASCADE,
    FOREIGN KEY (Author_ID) REFERENCES Authors(Author_ID) ON DELETE CASCADE
);

-- Ratings Table
CREATE TABLE Book_Ratings (
    Book_ID INT PRIMARY KEY,
    Rating_1_Star INT DEFAULT 0,
    Rating_2_Star INT DEFAULT 0,
    Rating_3_Star INT DEFAULT 0,
    Rating_4_Star INT DEFAULT 0,
    Rating_5_Star INT DEFAULT 0,
    FOREIGN KEY (Book_ID) REFERENCES Books(Book_ID) ON DELETE CASCADE
);

-- Load data from CSV files
COPY Authors(Author_ID, Name)
FROM '/docker-entrypoint-initdb.d/authors_only.csv' DELIMITER ',' CSV HEADER;

COPY Books(Book_ID, ISBN13, Publication_Year, Title, Rating_Avg, Rating_Count, Image_URL, Image_Small_URL)
FROM '/docker-entrypoint-initdb.d/books_only.csv' DELIMITER ',' CSV HEADER;

COPY Book_Author(Book_ID, Author_ID)
FROM '/docker-entrypoint-initdb.d/book_author.csv' DELIMITER ',' CSV HEADER;

COPY Book_Ratings(Book_ID, Rating_1_Star, Rating_2_Star, Rating_3_Star, Rating_4_Star, Rating_5_Star)
FROM '/docker-entrypoint-initdb.d/book_ratings.csv' DELIMITER ',' CSV HEADER;

SELECT setval('books_book_id_seq', (SELECT MAX(book_id) FROM Books));
SELECT setval('authors_author_id_seq', (SELECT MAX(author_id) FROM Authors));