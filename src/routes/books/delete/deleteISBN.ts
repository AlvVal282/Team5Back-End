import express, { Request, Response, Router, NextFunction } from 'express';

import {
    pool,
    validationFunctions,
} from '../../../core/utilities';

const isValidISBN13 = validationFunctions.isValidISBN13;

const deleteBookRouter: Router = express.Router();

/**
 * @api {delete} /book/:isbn Delete a book by ISBN
 *
 * @apiDescription Request to delete a book by its ISBN.
 *
 * @apiName DeleteISBN
 * @apiGroup delete
 *
 * @apiParam {String} isbn The ISBN of the book to delete
 *
<<<<<<< HEAD
 * @apiSuccess (Success 200) {string} messageSuccess "Book successfully deleted"
=======
 * @apiSuccess (Success 200) {String} message "Book successfully deleted."
>>>>>>> 93d2c59 (Removed unneccesary returns from delete author and ISBN)
 *
 * @apiError (400: Missing ISBN) {String} messageFailure "Missing or invalid ISBN parameter - please ensure that the ISBN is valid and/or entered"
 * @apiError (404: Not Found) {String} messageNotFound "Book not found"
 *
 */

deleteBookRouter.delete(
    '/book/:isbn',
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidISBN13(request.params.isbn)) {
            next();
        } else {
            response.status(400).send({
                messageFailure: 'Missing or invalid ISBN parameter - please ensure that the ISBN is valid and/or entered'
            });
        }
    },
    (request: Request, response: Response) => {
        const theQuery = 'DELETE FROM Books WHERE ISBN13 = $1';
        const values = [request.params.isbn];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount === 0) {
                    response.status(404).send({
                        messageNotFound: 'Book not found'
                    });
                } else{
                    response.status(200).send({
                        messageSuccess: 'Book successfully deleted'
                    });
                }
            })
            .catch((error) => {
                response.status(500).send({
                    message: 'An error occurred while trying to delete book',
                    error: error.message
                });
            });
    }
);

export { deleteBookRouter };