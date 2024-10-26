-- Active: 1710457548247@@127.0.0.1@5432@tcss460@public

-- Account Roles Table
CREATE TABLE Account_Role (
    Role_ID SERIAL PRIMARY KEY,
    Role_Name VARCHAR(50) NOT NULL
);

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
    FOREIGN KEY(Account_ID) REFERENCES Account(Account_ID)
);

-- Authors Table 
CREATE TABLE Authors (
    Author_ID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL UNIQUE
);

-- Books Table
CREATE TABLE Books (
    Book_ID SERIAL PRIMARY KEY,
    ISBN13 BIGINT UNIQUE,
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
    Rating_ID SERIAL PRIMARY KEY,
    Book_ID INT NOT NULL,
    Rating_Star INT CHECK (Rating_Star BETWEEN 1 AND 5),
    Rating_Count INT,
    FOREIGN KEY (Book_ID) REFERENCES Books(Book_ID) ON DELETE CASCADE
);

COPY books
FROM '/docker-entrypoint-initdb.d/books.csv'
DELIMITER ','
CSV HEADER;