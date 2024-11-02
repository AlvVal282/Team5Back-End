import express, { NextFunction, Request, Response, Router } from 'express';
import { pool, validationFunctions } from '../../../core/utilities';

const retrieveTitleRouter: Router = express.Router();

// Define the expected interfaces for consistent response structure
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

// Updated format function to return a structured object
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
 * @apiDescription Retrieve a list of books filtered by title. Allows partial matching on the title for flexibility.
 * 
 * @apiParam {String} title Partial or full title of the book to search for (required)
 * @apiQuery {number} limit The number of entry objects to return. If a value less than
 * 0 is provided, a non-numeric value is provided, or no value is provided, the default limit
 * of 10 will be used.
 * @apiQuery {number} offset The number to offset the lookup of entry objects to return. If a value
 * less than 0 is provided, a non-numeric value is provided, or no value is provided, the default
 * offset of 0 will be used.
 * 
 * @apiSuccess {Object[]} books List of books that match the provided title.
 * Each book entry is formatted with the fields isbn13, author, publication, title, ratings, and icons.
 * @apiSuccess {Object} pagination Pagination metadata for the response
 * @apiSuccess {number} pagination.totalRecords Total number of matching books
 * @apiSuccess {number} pagination.limit Number of entries returned per page
 * @apiSuccess {number} pagination.offset Offset used for the current query
 * @apiSuccess {number} pagination.nextPage Offset value to retrieve the next set of entries
 * 
 * @apiError (400) {String} message "Missing required parameter: title"
 * @apiError (400) {String} message "Invalid parameter: title must be a non-empty string"
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

            // Fetch paginated books matching the title
            const theQuery = `
                SELECT * FROM Books 
                WHERE title ILIKE '%' || $1 || '%' 
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