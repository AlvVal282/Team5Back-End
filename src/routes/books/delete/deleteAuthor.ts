import express, { Request, Response, Router, NextFunction } from 'express';

import {
    pool,
    validationFunctions,
} from '../../../core/utilities';

const isNumberProvided = validationFunctions.isNumberProvided;

const deleteAuthorRouter: Router = express.Router();

/**
 * @api {delete} /author/:id Delete all books of an author
 *
 * @apiDescription Request to delete all books of an author
 *
 * @apiName DeleteAuthor
 * @apiGroup delete
 *
 * @apiParam {Number} id The unique ID of the author to delete
 *
 * @apiSuccess (Success 200) {String} messageSuccess "All books of the author successfully deleted"
 *
 * @apiError (400: Missing ID) {String} messageFailure "Missing or invalid author ID  - please ensure that the Author is entered and/or valid"
 * @apiError (404: Not Found) {String} messageNotFound "Author not found"
 *
 */

deleteAuthorRouter.delete(
    '/author/:id',
    (request: Request, response: Response, next: NextFunction) => {
        if (isNumberProvided(request.params.id)) {
            next();
        } else {
            response.status(400).send({
                messageFailure: 'Missing or invalid author ID  - please ensure that the Author is entered and/or valid'
            });
        }
    },
    (request: Request, response: Response) => {
        const theQuery = 'DELETE FROM Book_Author WHERE Author_ID = $1';
        const values = [request.params.id];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount === 0) {
                    response.status(404).send({
                        message: `Author not found`
                    });
                } else{
                    response.status(200).send({
                        messageSuccess: 'All books of the author successfully deleted.'
                    });
                }
            })
            .catch((error) => {
                response.status(500).send({
                    message: 'An error occurred while trying to delete associations.',
                    error: error.message
                });
            });
    }
);

export { deleteAuthorRouter };