import express, { Request, Response, Router, NextFunction } from 'express';

import {
    pool,
    validationFunctions,
} from '../../core/utilities';

const isAuthorProvided = validationFunctions.isAuthorOrYearProvided;

const deleteAccountRouter: Router = express.Router();

/**
 * @api {delete} /deleteAccount Delete user's account
 *
 * @apiDescription Allows the user to permanently delete their account from the system. This action is irreversible.
 *
 * @apiName DeleteAccount
 * @apiGroup auth
 *
 * @apiHeader {String} Authorization Bearer token of the authenticated user. (Required)
 *
 * @apiSuccess (Success 200) {String} messageSuccess "Account successfully deleted."
 *
 * @apiError (400: Unauthorized) {String} messageUnauthorized "Authentication token is missing or invalid. Please log in again."
 * @apiError (404: User Not Found) {String} messageNotFound "User not found. Ensure you are logged in with the correct account."
 *
 */

deleteAccountRouter.delete(
    '/deleteAccount',
    (request: Request, response: Response, next: NextFunction) => {
        if (isAuthorProvided(request.params.id)) {
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

export { deleteAccountRouter };