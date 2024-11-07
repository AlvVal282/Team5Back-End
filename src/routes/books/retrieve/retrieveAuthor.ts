//express is the framework we're going to use to handle requests
import express, { Request, Response, Router, NextFunction } from 'express';
import { format } from 'path';

import {
    pool,
    validationFunctions,
} from '../../../core/utilities';

const isStringProvided = validationFunctions.isStringProvided;

const retrieveAuthorRouter: Router = express.Router();
/**
 * @api {get} /Author Request to retrieve all the entries by Author (using pagination)
 *
 * @apiName GetAuthor
 * @apiGroup retrieve
 *
 * @apiParam {String} Author the author in which we will look up
 * @apiQuery {number} limit The number of books to return. 
 * @apiQuery {number} offset The offset to lookup.
 *
 * @apiSuccess (Success 200) {Object []} books List of books by the author (Book_ID, Title, ISBN, and Publication_Year).
 * @apiSuccess (Success 200) {number} books.BookID unique book id
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
 * @apiError (400: Invalid Author) {String} message "Invalid or missing author - please ensure that param is entered and is valid"
 * @apiError (404: Author Not Found) {String} message "Author Not Found"
 *
 */
retrieveAuthorRouter.get(
    '/Author/:Author',
    (request: Request, response: Response, next: NextFunction) => {
        if (isStringProvided(request.params.Author)) {
            next();
        } else {
            response.status(400).send({
                message: 'Invalid or missing author - please ensure that param is entered and is valid',
            });
        }
    },
    async (request: Request, response: Response) => {
        try {
            // Use the validated limit and offset values
            const limit = Number(request.query.limit);
            const offset = Number(request.query.offset);

            const theQuery = `SELECT * FROM Books
                              JOIN Book_Author ON Books.Book_ID = Book_Author.Book_ID
                              JOIN Authors ON Authors.Author_ID = Book_Author.Author_ID
                              WHERE Authors.Name = $1
                              ORDER BY Book_ID
                              LIMIT $2
                              OFFSET $3`;

            const values = [request.params.Author, limit, offset]; 

            const { rows } = await pool.query(theQuery, values);

            if (rows.length === 0) {
                response.status(404).send({
                    message: 'Author Not Found'
                });
            }
        
            const countQuery = await pool.query(
                `SELECT COUNT(*) AS total_count FROM Books
                 JOIN Book_Author ON Books.Book_ID = Book_Author.Book_ID
                 JOIN Authors ON Authors.Author_ID = Book_Author.Author_ID
                 WHERE Authors.Name = $1`
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
                message: 'Server error - DB error while trying to retrieve a book by Author'
            });
        }
        
    }
);

export { retrieveAuthorRouter };
