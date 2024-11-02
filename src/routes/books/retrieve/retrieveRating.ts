import express, { NextFunction, Request, Response, Router } from 'express';
import { pool } from '../../../core/utilities';

const retrieveRatingRouter: Router = express.Router();

const format = (resultRow) =>
    `ISBN: ${resultRow.isbn13}, Title: "${resultRow.title}", Rating: ${resultRow.rating_avg}`;

/**
 * Middleware to validate rating query parameters.
 * Ensures minRating and maxRating are numbers between 1 and 5.
 * Sends a 400 error if validation fails.
 */
function mwValidRatingParams(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const minRating = parseFloat(request.query.minRating as string);
    const maxRating = parseFloat(request.query.maxRating as string);

    if (
        !isNaN(minRating) && minRating >= 1 && minRating <= 5 &&
        !isNaN(maxRating) && maxRating >= 1 && maxRating <= 5
    ) {
        next();
    } else {
        console.error('Invalid rating parameters');
        response.status(400).send({
            message: 'Invalid rating parameters - must be between 1 and 5',
        });
    }
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
 * @apiQuery {number} limit The number of entry objects to return. If a value less than
 * 0 is provided, a non-numeric value is provided, or no value is provided, the default limit
 * of 10 will be used.
 * @apiQuery {number} offset The number to offset the lookup of entry objects to return. If a value
 * less than 0 is provided, a non-numeric value is provided, or no value is provided, the default
 * offset of 0 will be used.
 * 
 * @apiSuccess {Object[]} books List of books that fall within the specified rating range.
 * Each book entry is formatted as "ISBN: {isbn13}, Title: '{title}', Rating: {rating_avg}".
 * @apiSuccess {Object} pagination Pagination metadata for the response
 * @apiSuccess {number} pagination.totalRecords Total number of books in the rating range
 * @apiSuccess {number} pagination.limit Number of entries returned per page
 * @apiSuccess {number} pagination.offset Offset used for the current query
 * @apiSuccess {number} pagination.nextPage Offset value to retrieve the next set of entries
 * 
 * @apiError (400) {String} message "Invalid or missing rating parameters - must be both min and max rating both between 1 and 5"
 */
retrieveRatingRouter.get(
    '/retrieveRating',
    mwValidRatingParams,
    async (request: Request, response: Response) => {
        const minRating = parseFloat(request.query.minRating as string);
        const maxRating = parseFloat(request.query.maxRating as string);
        
        // Set default values for limit and offset if not provided
        const limit = (Number(request.query.limit) > 0) ? Number(request.query.limit) : 10;
        const offset = (Number(request.query.offset) >= 0) ? Number(request.query.offset) : 0;

        try {
            // Count total books matching the rating range
            const countQuery = `
                SELECT COUNT(*) AS totalRecords 
                FROM Books 
                WHERE Rating_Avg BETWEEN $1 AND $2
            `;
            const countResult = await pool.query(countQuery, [minRating, maxRating]);
            const totalRecords = parseInt(countResult.rows[0].totalrecords, 10);

            // Fetch paginated books within the rating range
            const theQuery = `
                SELECT * FROM Books 
                WHERE Rating_Avg BETWEEN $1 AND $2
                LIMIT $3 OFFSET $4
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