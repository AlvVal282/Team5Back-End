import express, { Request, Response, Router, NextFunction } from 'express';
import { format } from 'path';

import {
    pool,
    validationFunctions,
} from '../../../core/utilities';

const retrieveBooksRouter: Router = express.Router();

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
 * @api {get} /Books Request to retrieve all books (with pagination)
 *
 * @apiName GetBooks
 * @apiGroup retrieve
 *
 * @apiQuery {number} limit The number of books to return. 
 * @apiQuery {number} offset The offset to lookup. 
 *
 * @apiSuccess (Success 200) {Object []} books List of all books (each contains Book_ID, Title, ISBN, and Publication_Year).
 * @apiSuccess (Success 200) {Number} books.BookID unique book id
 * @apiSuccess (Success 200) {BIGINT} books.ISBN unique book ISBN 
 * @apiSuccess (Success 200) {INT} books.Publication_Year the year the book was published
 * @apiSuccess (Success 200) {String} books.Title the book title 
 * @apiSuccess (Success 200) {TEXT} books.Image_URL url of the books image 
 * @apiSuccess (Success 200) {Object} pagination Pagination metadata for the response
 * @apiSuccess (Success 200) {number} pagination.totalRecords Total number of books.
 * @apiSuccess (Success 200) {number} pagination.limit Number of entries returned per page.
 * @apiSuccess (Success 200) {number} pagination.offset Offset used for the current query.
 * @apiSuccess (Success 200) {number} pagination.nextPage Offset value to retrieve the next set of entries.
 *
 * @apiError (500 : failed connection to database) {String} message "Internal Server Error: Failed to connect to the database."
 *
 */
retrieveBooksRouter.get(
    '/Books',
   async (request: Request, response: Response) => {
        // Use the validated limit and offset values
        const limit = Number(request.query.limit);
        const offset = Number(request.query.offset);

        try {
            const theQuery = ` SELECT * FROM Books
                                ORDER BY Book_ID
                                LIMIT $1
                                OFFSET $2`;

            const values = [limit, offset];

            const { rows } = await pool.query(theQuery, values);

            const countQuery = await pool.query(
                `SELECT COUNT(*) AS total_count FROM Books`
            );
            const count = countQuery.rows[0].total_count;

            response.status(200).send({
                books: rows.map(format),
                pagination: {
                    totalRecords: count,
                    limit,
                    offset,
                    nextPage: offset + limit < count ? offset + limit : null, 
                },
            });
        } catch(error) {
            response.status(500).send({
                message: 'Server error - DB error while trying to retrieve a book by ISBN'
            });
        }
    }

);

export { retrieveBooksRouter };
