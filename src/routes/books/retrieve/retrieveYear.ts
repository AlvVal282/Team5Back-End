//apidoc -i ./src/ -o ./docs/
import express, { NextFunction, Request, Response, Router } from 'express';
import { pool, validationFunctions } from '../../../core/utilities';

const retrieveYearRouter: Router = express.Router();

// Define interfaces for type consistency
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

// Updated format function to match specified IBook structure
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
 * Middleware to validate year range parameters.
 * Ensures startYear and endYear are valid, non-negative numbers, and in the correct order.
 */
function mwValidYearParams(request: Request, response: Response, next: NextFunction) {
    const startYear = parseInt(request.query.startYear as string, 10);
    const endYear = parseInt(request.query.endYear as string, 10);

    if (!request.query.startYear || !request.query.endYear) {
        return response.status(400).send({
            message: 'Missing required parameters: startYear and endYear',
        });
    }

    if (isNaN(startYear) || isNaN(endYear)) {
        return response.status(400).send({
            message: 'Invalid parameters: startYear and endYear must be numbers',
        });
    }

    if (startYear < 0 || endYear < 0) {
        return response.status(400).send({
            message: 'Invalid parameters: startYear and endYear cannot be negative',
        });
    }

    if (startYear > endYear) {
        return response.status(400).send({
            message: 'Invalid range: startYear cannot be greater than endYear',
        });
    }

    next();
}

/**
 * Middleware to validate limit and offset parameters.
 * Sets defaults if values are invalid or not provided.
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
 * @api {get} /books/year Retrieve Books by Publication Year
 * @apiName GetBooksByYear
 * @apiGroup Books
 * 
 * @apiDescription Retrieve a list of books published within a specific year range.
 * 
 * @apiParam {Number} startYear The starting year for the publication range (required)
 * @apiParam {Number} endYear The ending year for the publication range (required)
 * @apiQuery {number} limit The number of entry objects to return, defaults to 10 if not provided or invalid.
 * @apiQuery {number} offset The number to offset the lookup, defaults to 0 if not provided or invalid.
 * 
 * @apiSuccess {Object[]} books List of books that fall within the specified publication year range.
 * Each book entry is formatted with the fields isbn13, author, publication, title, ratings, and icons.
 * @apiSuccess {Object} pagination Pagination metadata for the response
 * @apiSuccess {number} pagination.totalRecords The total number of matching records
 * @apiSuccess {number} pagination.limit The number of records per page
 * @apiSuccess {number} pagination.offset The offset for the current page
 * @apiSuccess {number} pagination.nextPage The offset for the next page of results
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required parameters: startYear and endYear"
 * @apiError (400: Invalid Parameters) {String} message "Invalid parameters: startYear and endYear must be numbers"
 * @apiError (400: Invalid Range Order) {String} message "Invalid parameters: startYear and endYear cannot be negative"
 * @apiError (400: Invalid Range Order) {String} message "Invalid range: startYear cannot be greater than endYear"
 */
retrieveYearRouter.get(
    '/retrieveYear',
    mwValidYearParams,
    mwValidPaginationParams,
    async (request: Request, response: Response) => {
        const startYear = parseInt(request.query.startYear as string, 10);
        const endYear = parseInt(request.query.endYear as string, 10);

        // Use validated limit and offset for pagination
        const limit = Number(request.query.limit);
        const offset = Number(request.query.offset);

        try {
            // Count total books published within the year range
            const countQuery = `
                SELECT COUNT(*) AS "totalRecords" 
                FROM Books 
                WHERE publication_year BETWEEN $1 AND $2
            `;
            const countResult = await pool.query(countQuery, [startYear, endYear]);
            const totalRecords = parseInt(countResult.rows[0].totalRecords, 10);

            // Fetch paginated books published within the year range
            const theQuery = `
                SELECT 
                    Books.isbn13,
                    Books.publication_year,
                    Books.title,
                    Books.rating_avg,
                    Books.rating_count,
                    COALESCE(Book_Ratings.rating_1_star, 0) AS rating_1_star,
                    COALESCE(Book_Ratings.rating_2_star, 0) AS rating_2_star,
                    COALESCE(Book_Ratings.rating_3_star, 0) AS rating_3_star,
                    COALESCE(Book_Ratings.rating_4_star, 0) AS rating_4_star,
                    COALESCE(Book_Ratings.rating_5_star, 0) AS rating_5_star,
                    Books.image_url,
                    Books.image_small_url,
                    STRING_AGG(Authors.Name, ', ') AS authors
                FROM Books
                LEFT JOIN Book_Ratings ON Books.Book_ID = Book_Ratings.Book_ID
                JOIN Book_Author ON Books.Book_ID = Book_Author.Book_ID
                JOIN Authors ON Authors.Author_ID = Book_Author.Author_ID
                WHERE Books.publication_year BETWEEN $1 AND $2
                GROUP BY 
                    Books.isbn13, 
                    Books.publication_year, 
                    Books.title, 
                    Books.rating_avg, 
                    Books.rating_count, 
                    Books.image_url, 
                    Books.image_small_url,
                    Book_Ratings.rating_1_star,
                    Book_Ratings.rating_2_star,
                    Book_Ratings.rating_3_star,
                    Book_Ratings.rating_4_star,
                    Book_Ratings.rating_5_star
                LIMIT $3 OFFSET $4
            `;

            const values = [startYear, endYear, limit, offset];
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
            console.error('DB Query error on retrieve by year', error);
            response.status(500).send({
                message: 'Server error - contact support',
            });
        }
    }
);

export { retrieveYearRouter };
