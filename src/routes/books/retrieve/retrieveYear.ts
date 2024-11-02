import express, { NextFunction, Request, Response, Router } from 'express';
import { pool, validationFunctions } from '../../../core/utilities';

const retrieveYearRouter: Router = express.Router();

const format = (resultRow) =>
    `ISBN: ${resultRow.isbn13}, Title: "${resultRow.title}", Published: ${resultRow.publication}`;

/**
 * Middleware to validate year range parameters.
 * Ensures startYear and endYear are valid numbers and in the correct order.
 */
function mwValidYearParams(request: Request, response: Response, next: NextFunction) {
    const startYear = parseInt(request.query.startYear as string, 10);
    const endYear = parseInt(request.query.endYear as string, 10);

    if (
        validationFunctions.isNumberProvided(startYear) &&
        validationFunctions.isNumberProvided(endYear) &&
        startYear <= endYear
    ) {
        next();
    } else {
        console.error('Invalid or missing year parameters');
        response.status(400).send({
            message: 'Invalid or missing year parameters - please refer to documentation',
        });
    }
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
 * @apiQuery {number} limit The number of entry objects to return. If a value less than
 * 0 is provided, a non-numeric value is provided, or no value is provided, the default limit
 * of 10 will be used.
 * @apiQuery {number} offset The number to offset the lookup of entry objects to return. If a value
 * less than 0 is provided, a non-numeric value is provided, or no value is provided, the default
 * offset of 0 will be used.
 * 
 * @apiSuccess {Object[]} books List of books that fall within the specified publication year range.
 * @apiSuccess {Number} books.isbn13 ISBN-13 identifier of the book
 * @apiSuccess {String} books.authors Authors of the book
 * @apiSuccess {Number} books.publication Publication year of the book
 * @apiSuccess {String} books.title Title of the book
 * @apiSuccess {Object} pagination Pagination metadata
 * @apiSuccess {number} pagination.totalRecords The total number of matching records
 * @apiSuccess {number} pagination.limit The number of records per page
 * @apiSuccess {number} pagination.offset The offset for the current page
 * @apiSuccess {number} pagination.nextPage The offset for the next page of results
 * 
 * @apiError (400) {String} message "Invalid or missing year parameters - please refer to documentation"
 */
retrieveYearRouter.get(
    '/retrieveYear',
    mwValidYearParams,
    async (request: Request, response: Response) => {
        const startYear = parseInt(request.query.startYear as string, 10);
        const endYear = parseInt(request.query.endYear as string, 10);

        // Use `limit` and `offset` for pagination, with defaults
        const limit = (Number(request.query.limit) > 0) ? Number(request.query.limit) : 10;
        const offset = (Number(request.query.offset) >= 0) ? Number(request.query.offset) : 0;

        try {
            // Count total books published within the year range
            const countQuery = `
                SELECT COUNT(*) AS totalRecords 
                FROM Books 
                WHERE publication_year BETWEEN $1 AND $2
            `;
            const countResult = await pool.query(countQuery, [startYear, endYear]);
            const totalRecords = parseInt(countResult.rows[0].totalrecords, 10);

            // Fetch paginated books published within the year range
            const theQuery = `
                SELECT * FROM Books 
                WHERE publication_year BETWEEN $1 AND $2 
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
