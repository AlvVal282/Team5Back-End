import express, { NextFunction, Request, Response, Router } from 'express';
import { pool } from '../../../core/utilities';

const retrieveRatingRouter: Router = express.Router();

// Define interfaces for type consistency (optional)
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
 * Middleware to validate rating query parameters.
 * Ensures minRating and maxRating are provided, are numbers, and are within the range 1 to 5.
 * Sends a specific 400 error for missing or invalid values.
 */
function mwValidRatingParams(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const minRating = request.query.minRating;
    const maxRating = request.query.maxRating;

    if (!minRating || !maxRating) {
        response.status(400).send({
            message: 'Missing required parameters: minRating and maxRating',
        });
        return;
    }

    const minRatingNum = parseFloat(minRating as string);
    const maxRatingNum = parseFloat(maxRating as string);

    if (isNaN(minRatingNum) || isNaN(maxRatingNum)) {
        response.status(400).send({
            message: 'Invalid parameters: minRating and maxRating must be numbers',
        });
        return;
    }

    if (minRatingNum < 1 || minRatingNum > 5 || maxRatingNum < 1 || maxRatingNum > 5) {
        response.status(400).send({
            message: 'Out of range: minRating and maxRating must be between 1 and 5',
        });
        return;
    }

    if (minRatingNum > maxRatingNum) {
        response.status(400).send({
            message: 'Invalid range: minRating cannot be greater than maxRating',
        });
        return;
    }

    next();
}

/**
 * @api {get} /books/rating Retrieve Books by Rating
 * @apiName GetBooksByRating
 * @apiGroup Books
 * 
 * @apiDescription Retrieve a list of books filtered by average rating. Allows clients to specify a minimum and maximum rating range.
 * 
 * @apiParam {Number} minRating Minimum average rating for filtering books (required, must be between 1 and 5)
 * @apiParam {Number} maxRating Maximum average rating for filtering books (required, must be between 1 and 5)
 * @apiQuery {number} limit The number of entry objects to return. Defaults to 10 if not provided or invalid.
 * @apiQuery {number} offset The offset for the lookup. Defaults to 0 if not provided or invalid.
 * 
 * @apiSuccess {Object[]} books List of books that fall within the specified rating range.
 * Each book entry is formatted as "ISBN: {isbn13}, Title: '{title}', Rating: {rating_avg}".
 * @apiSuccess {Object} pagination Pagination metadata for the response
 * @apiSuccess {number} pagination.totalRecords Total number of books in the rating range
 * @apiSuccess {number} pagination.limit Number of entries returned per page
 * @apiSuccess {number} pagination.offset Offset used for the current query
 * @apiSuccess {number} pagination.nextPage Offset value to retrieve the next set of entries
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required parameters: minRating and maxRating" 
 * @apiError (400: Invalid Parameters) {String} message "Invalid parameters: minRating and maxRating must be numbers"
 * @apiError (400: Out of Range) {String} message "Out of range: minRating and maxRating must be between 1 and 5"
 * @apiError (400: Invalid Range Order) {String} message "Invalid range: minRating cannot be greater than maxRating"
 */
retrieveRatingRouter.get(
    '/retrieveRating',
    mwValidRatingParams,
    async (request: Request, response: Response) => {
        const minRating = parseFloat(request.query.minRating as string);
        const maxRating = parseFloat(request.query.maxRating as string);

        const limit = (Number(request.query.limit) > 0) ? Number(request.query.limit) : 10;
        const offset = (Number(request.query.offset) >= 0) ? Number(request.query.offset) : 0;

        try {
            const countQuery = `
                SELECT COUNT(*) AS "totalRecords" 
                FROM Books 
                WHERE Rating_Avg BETWEEN $1 AND $2
            `;
            const countResult = await pool.query(countQuery, [minRating, maxRating]);
            const totalRecords = parseInt(countResult.rows[0].totalRecords, 10);

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
WHERE Books.Rating_Avg BETWEEN $1 AND $2
GROUP BY 
    Books.isbn13, 
    Books.publication_year, 
    Books.title, 
    Books.rating_avg, 
    Books.rating_count, 
    Books.image_url, 
    Books.image_small_url
LIMIT $3 OFFSET $4;

            `;
            const values = [minRating, maxRating, limit, offset];
            const { rows } = await pool.query(theQuery, values);

            response.status(200).send({
                books: rows.map(format),
                pagination: {
                    totalRecords,
                    limit,
                    offset,
                    nextPage: offset + limit < totalRecords ? offset + limit : null,
                },
            });
        } catch (error) {
            console.error('DB Query error on retrieve by rating', error);
            response.status(500).send({
                message: 'Server error - contact support',
            });
        }
    }
);

export { retrieveRatingRouter };






