import express, { Request, Response, Router, NextFunction } from 'express';

import {
    pool,
    validationFunctions,
} from '../../../core/utilities';

const isISBNProvided = validationFunctions.isValidISBN13;

const retrieveISBNRouter: Router = express.Router();

// Define interfaces for consistent response structure
interface IRatings {
    average: number;
    count: number;
    rating_1: number;
    rating_2: number;
    rating_3: number;
    rating_4: number;
    rating_5: number;
}

interface IUrlIcon {
    large: string;
    small: string;
}

interface IBook {
    isbn13: number;
    author: string;
    publication: number;
    title: string;
    ratings: IRatings;
    icons: IUrlIcon;
}

// Format function to structure each book object
const format = (resultRow): IBook => ({
    isbn13: resultRow.isbn13,
    author: resultRow.authors,
    publication: resultRow.publication_year,
    title: resultRow.title,
    ratings: {
        average: resultRow.rating_avg,
        count: resultRow.rating_count,
        rating_1: resultRow.rating_1_star,
        rating_2: resultRow.rating_2_star,
        rating_3: resultRow.rating_3_star,
        rating_4: resultRow.rating_4_star,
        rating_5: resultRow.rating_5_star,
    },
    icons: {
        large: resultRow.image_url,
        small: resultRow.image_small_url,
    },
});
/**
 * @api {get} /retrieveISBN Request to retrieve an entry by ISBN
 *
 * @apiName GetISBN
 * @apiGroup retrieve
 *
 * @apiQuery {Number} ISBN the ISBN number we will look up
 *
 * @apiSuccess (Success 200) {Object} book the book entree retrieved by ISBN
 * @apiSuccess (Success 200) {Number} books.isbn13 Unique ISBN-13 identifier of the book.
 * @apiSuccess (Success 200) {String} books.author Comma-separated list of authors of the book.
 * @apiSuccess (Success 200) {Number} books.publication Publication year of the book.
 * @apiSuccess (Success 200) {String} books.title Title of the book.
 * @apiSuccess (Success 200) {Object} books.ratings Rating details of the book.
 * @apiSuccess (Success 200) {Number} books.ratings.average Average rating score.
 * @apiSuccess (Success 200) {Number} books.ratings.count Total number of ratings.
 * @apiSuccess (Success 200) {Number} books.ratings.rating_1 Count of 1-star ratings.
 * @apiSuccess (Success 200) {Number} books.ratings.rating_2 Count of 2-star ratings.
 * @apiSuccess (Success 200) {Number} books.ratings.rating_3 Count of 3-star ratings.
 * @apiSuccess (Success 200) {Number} books.ratings.rating_4 Count of 4-star ratings.
 * @apiSuccess (Success 200) {Number} books.ratings.rating_5 Count of 5-star ratings.
 * @apiSuccess (Success 200) {Object} books.icons URLs to book cover images.
 * @apiSuccess (Success 200) {String} books.icons.large URL to the large version of the book cover image.
 * @apiSuccess (Success 200) {String} books.icons.small URL to the small version of the book cover image.
 * 
 * 
 *
 * @apiError (400: Invalid ISBN) {String} message "Invalid or missing ISBN - please ensure that param is entered and is valid"
 * @apiError (404: ISBN Not Found) {String} message "ISBN Not Found"
 *
 */
retrieveISBNRouter.get(
    '/retrieveISBN',
    (request: Request, response: Response, next: NextFunction) => {
        const isbn = request.query.ISBN as String;
        if(isISBNProvided(isbn)) {
            next();
        } else {
            response.status(400).send({
                message: 'Invalid or missing ISBN - please ensure that param is entered and is valid',
            });
        }
    },

    async (request: Request, response: Response) => {
        const isbn = request.query.ISBN as string;
        const theQuery = `
            SELECT 
                Books.isbn13,
                Books.publication_year,
                Books.title,
                Books.rating_avg,
                Books.rating_count,
                COALESCE(SUM(Book_Ratings.rating_1_star), 0) AS rating_1_star,
                COALESCE(SUM(Book_Ratings.rating_2_star), 0) AS rating_2_star,
                COALESCE(SUM(Book_Ratings.rating_3_star), 0) AS rating_3_star,
                COALESCE(SUM(Book_Ratings.rating_4_star), 0) AS rating_4_star,
                COALESCE(SUM(Book_Ratings.rating_5_star), 0) AS rating_5_star,
                Books.image_url,
                Books.image_small_url,
                STRING_AGG(Authors.Name, ', ') AS authors
            FROM Books
            LEFT JOIN Book_Ratings ON Books.Book_ID = Book_Ratings.Book_ID
            JOIN Book_Author ON Books.Book_ID = Book_Author.Book_ID
            JOIN Authors ON Authors.Author_ID = Book_Author.Author_ID
            WHERE Books.ISBN13 = $1
            GROUP BY 
                Books.isbn13, 
                Books.publication_year, 
                Books.title, 
                Books.rating_avg, 
                Books.rating_count, 
                Books.image_url, 
                Books.image_small_url
        `;
        const values = [isbn];

        try {
            const result = await pool.query(theQuery, values);

            if (result.rowCount === 0) {
                response.status(404).send({
                    message: 'ISBN Not Found.',
                });
            } else {
                const book = format(result.rows[0]);
                response.status(200).json({ book });
            }
        } catch (error) {
            //console.error('Database error:', error);
            response.status(500).send({
                message: 'Server error - unable to retrieve book by ISBN.',
            });
        }
    }
);

export { retrieveISBNRouter };


    
