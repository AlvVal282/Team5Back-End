import express, { NextFunction, Request, Response, Router } from 'express';
import { pool, validationFunctions } from '../../../core/utilities';

const retrieveTitleRouter: Router = express.Router();

const format = (resultRow) =>
    `ISBN: ${resultRow.isbn13}, Title: "${resultRow.title}", Author(s): ${resultRow.authors}`;

/**
 * Middleware to validate the title parameter.
 * Ensures the title parameter is provided as a non-empty string.
 * Sends a 400 error if validation fails.
 */
function mwValidTitleParam(request: Request, response: Response, next: NextFunction) {
    const { title } = request.query;

    if (validationFunctions.isStringProvided(title as string)) {
        next();
    } else {
        console.error('Missing or invalid title parameter');
        response.status(400).send({
            message: 'Missing or invalid title parameter - please refer to documentation',
        });
    }
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
 * Each book entry is formatted as "ISBN: {isbn13}, Title: '{title}', Author(s): {authors}".
 * @apiSuccess {Object} pagination Pagination metadata for the response
 * @apiSuccess {number} pagination.totalRecords Total number of matching books
 * @apiSuccess {number} pagination.limit Number of entries returned per page
 * @apiSuccess {number} pagination.offset Offset used for the current query
 * @apiSuccess {number} pagination.nextPage Offset value to retrieve the next set of entries
 * 
 * @apiError (400) {String} message "Missing or invalid title parameter - please refer to documentation"
 */
retrieveTitleRouter.get(
    '/retrieveTitle',
    mwValidTitleParam,
    async (request: Request, response: Response) => {
        const { title } = request.query;
        
        // Set default values for limit and offset if not provided
        const limit = (Number(request.query.limit) > 0) ? Number(request.query.limit) : 10;
        const offset = (Number(request.query.offset) >= 0) ? Number(request.query.offset) : 0;

        try {
            // Count total books matching the title
            const countQuery = `
                SELECT COUNT(*) AS totalRecords 
                FROM Books 
                WHERE title ILIKE '%' || $1 || '%'
            `;
            const countResult = await pool.query(countQuery, [title]);
            const totalRecords = parseInt(countResult.rows[0].totalrecords, 10);

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