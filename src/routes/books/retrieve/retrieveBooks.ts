import express, { NextFunction, Request, Response, Router } from 'express';
import { pool } from '../../../core/utilities';

const retrieveBooksRouter: Router = express.Router();

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

// format function to structure each book object
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
 * Middleware to validate limit and offset parameters.
 */
function mwValidPaginationParams(request: Request, response: Response, next: NextFunction) {
    let limit = Number(request.query.limit);
    let offset = Number(request.query.offset);

    if (isNaN(limit) || limit <= 0) {
        limit = 10; // Default limit
    }

    if (isNaN(offset) || offset < 0) {
        offset = 0; // Default offset
    }

    request.query.limit = limit.toString();
    request.query.offset = offset.toString();

    next();
}

/**
 * @api {get} /retrieveBooks Retrieve All Books
 * @apiName GetBooks
 * @apiGroup retrieve
 * 
 * @apiDescription Retrieve a paginated list of all books in the database.
 * 
 * @apiQuery {number} limit The number of entry objects to return (default 10)
 * @apiQuery {number} offset The number to offset the lookup of entry objects to return (default 0)
 * 
 * 
 * @apiSuccess {Object[]} books List of all books.
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
 * @apiSuccess {Object} pagination Pagination metadata for the response
 * @apiSuccess {number} pagination.totalRecords Total number of books in the database
 * @apiSuccess {number} pagination.limit Number of entries returned per page
 * @apiSuccess {number} pagination.offset Offset used for the current query
 * @apiSuccess {number} pagination.nextPage Offset value to retrieve the next set of entries
 * 
 * @apiError (500) {String} message "Server error - DB error while trying to retrieve books"
 */
retrieveBooksRouter.get(
    '/retrieveBooks',
    mwValidPaginationParams,
    async (request: Request, response: Response) => {
        const limit = Number(request.query.limit);
        const offset = Number(request.query.offset);

        try {
            // Query to get total count of books for pagination
            const countQuery = `
                SELECT COUNT(*) AS "totalRecords" FROM Books`;
            
            const countResult = await pool.query(countQuery);
            const totalRecords = parseInt(countResult.rows[0].totalRecords, 10);

            // Main query to retrieve paginated books
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
                GROUP BY 
                    Books.isbn13, 
                    Books.publication_year, 
                    Books.title, 
                    Books.rating_avg, 
                    Books.rating_count, 
                    Books.image_url, 
                    Books.image_small_url    
                LIMIT $1 OFFSET $2
            `;

            const values = [limit, offset];
            const { rows } = await pool.query(theQuery, values);

            response.status(200).json({
                books: rows.map(format),
                pagination: {
                    totalRecords,
                    limit,
                    offset,
                    nextPage: offset + limit < totalRecords ? offset + limit : null,
                },
            });
        } catch (error) {
            //console.error('DB Query error on retrieve books', error);
            response.status(500).send({
                message: 'Server error - DB error while trying to retrieve books',
            });
        }
    }
);

export { retrieveBooksRouter };
