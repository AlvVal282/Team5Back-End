import express, { NextFunction, Request, Response, Router } from 'express';
import { pool, validationFunctions } from '../../../core/utilities';

const retrieveTitleRouter: Router = express.Router();

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

// Format function to return a structured IBook object
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
 * Middleware to validate the title parameter.
 * Ensures the title parameter is provided as a non-empty string.
 * Sends a 400 error if validation fails.
 */
function mwValidTitleParam(request: Request, response: Response, next: NextFunction) {
    const { title } = request.query;

    if (!title) {
        return response.status(400).send({
            message: 'Missing required parameter: title',
        });
    }

    if (!validationFunctions.isStringProvided(title as string)) {
        return response.status(400).send({
            message: 'Invalid parameter: title must be a non-empty string',
        });
    }

    next();
}

/**
 * Middleware to validate limit and offset parameters.
 * Ensures they are non-negative integers, and defaults them if invalid.
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
 * @api {get} /books/title Retrieve Books by Title
 * @apiName GetBooksByTitle
 * @apiGroup Books
 * 
 * @apiDescription Retrieve a list of books filtered by title, with optional pagination.
 * Allows partial matching on the title for flexibility.
 * 
 * @apiParam {String} title Partial or full title of the book to search for (required).
 * @apiQuery {Number} [limit=10] Number of books to return per page (optional, defaults to 10).
 * @apiQuery {Number} [offset=0] Number of books to skip (optional, defaults to 0).
 * 
 * @apiSuccess (Success 200) {Object[]} books List of books matching the specified title.
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
 * @apiSuccess (Success 200) {Object} books.icons URLs to the book cover images.
 * @apiSuccess (Success 200) {String} books.icons.large URL to the large version of the book cover image.
 * @apiSuccess (Success 200) {String} books.icons.small URL to the small version of the book cover image.
 * 
 * @apiSuccess (Success 200) {Object} pagination Pagination metadata.
 * @apiSuccess (Success 200) {Number} pagination.totalRecords Total number of matching books.
 * @apiSuccess (Success 200) {Number} pagination.limit Number of entries returned per page.
 * @apiSuccess (Success 200) {Number} pagination.offset Offset used for the current query.
 * @apiSuccess (Success 200) {Number|null} pagination.nextPage Offset for the next page of results, or null if there are no more pages.
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required parameter: title".
 * @apiError (400: Invalid Parameters) {String} message "Invalid parameter: title must be a non-empty string".
 * @apiError (404: Not Found) {String} message "No books found matching the specified title".
 * @apiError (500: Server Error) {String} message "Server error - contact support".
 */
retrieveTitleRouter.get(
    '/retrieveTitle',
    mwValidTitleParam,
    mwValidPaginationParams,
    async (request: Request, response: Response) => {
        const { title } = request.query;

        // Use the validated limit and offset values
        const limit = Number(request.query.limit);
        const offset = Number(request.query.offset);

        try {
            // Count total books matching the title
            const countQuery = `
                SELECT COUNT(*) AS "totalRecords" 
                FROM Books 
                WHERE title ILIKE '%' || $1 || '%'
            `;
            const countResult = await pool.query(countQuery, [title]);
            const totalRecords = parseInt(countResult.rows[0].totalRecords, 10);

            // Return 404 if no matching records found
            if (totalRecords === 0) {
                return response.status(404).json({
                    message: 'No books found matching the specified title.',
                });
            }

            // Fetch paginated books matching the title
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
                WHERE Books.title ILIKE '%' || $1 || '%'
                GROUP BY 
                    Books.isbn13, 
                    Books.publication_year, 
                    Books.title, 
                    Books.rating_avg, 
                    Books.rating_count, 
                    Books.image_url, 
                    Books.image_small_url
                LIMIT $2 OFFSET $3
            `;

            const values = [title, limit, offset];
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
            console.error('DB Query error on retrieve by title', error);
            response.status(500).send({
                message: 'Server error - contact support',
            });
        }
    }
);

export { retrieveTitleRouter };

