import express, { Request, Response, Router, NextFunction } from 'express';
import { pool, validationFunctions } from '../../../core/utilities';

const isISBNProvided = validationFunctions. isValidISBN13;

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
 * @api {get} /retrieveISBN Retrieve a book by ISBN
 * @apiName GetBookByISBN
 * @apiGroup Books
 *
 * @apiQuery (Query Parameters){Number} ISBN The ISBN number to look up.
 *
 * @apiSuccess {Object} book Book details.
 * @apiSuccess {number} book.isbn13 Book's ISBN number.
 * @apiSuccess {string} book.author Book author(s).
 * @apiSuccess {number} book.publication Publication year.
 * @apiSuccess {string} book.title Book title.
 * @apiSuccess {Object} book.ratings Ratings structure.
 * @apiSuccess {number} book.ratings.average Average rating.
 * @apiSuccess {number} book.ratings.count Rating count.
 * @apiSuccess {number} book.ratings.rating_1 Rating count for 1 star.
 * @apiSuccess {number} book.ratings.rating_2 Rating count for 2 stars.
 * @apiSuccess {number} book.ratings.rating_3 Rating count for 3 stars.
 * @apiSuccess {number} book.ratings.rating_4 Rating count for 4 stars.
 * @apiSuccess {number} book.ratings.rating_5 Rating count for 5 stars.
 * @apiSuccess {Object} book.icons Icon structure.
 * @apiSuccess {string} book.icons.large URL for large image.
 * @apiSuccess {string} book.icons.small URL for small image.
 * 
 * @apiError (400: Invalid ISBN) {string} message "Invalid or missing ISBN - please ensure the ISBN parameter is provided and valid."
 * @apiError (404: ISBN Not Found) {string} message "ISBN Not Found."
 */
retrieveISBNRouter.get(
    '/retrieveISBN',
    (request: Request, response: Response, next: NextFunction) => {
        const isbn = request.query.ISBN as string;
        if (isISBNProvided(isbn)) {
            next();
        } else {
            response.status(400).send({
                message: 'Invalid or missing ISBN - please ensure the ISBN parameter is provided and valid.',
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
            console.error('Database error:', error);
            response.status(500).send({
                message: 'Server error - unable to retrieve book by ISBN.',
            });
        }
    }
);

export { retrieveISBNRouter };

