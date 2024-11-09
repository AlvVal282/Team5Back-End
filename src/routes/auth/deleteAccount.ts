import express, { Request, Response, Router, NextFunction } from 'express';

import {
    pool,
    validationFunctions,
} from '../../core/utilities';

const isAccountProvided = validationFunctions.isAuthorOrYearProvided;

const deleteAccountRouter: Router = express.Router();

/**
 * @api {delete} /account/:id Delete user's account
 *
 * @apiDescription Allows the user to permanently delete their account from the system. This action is irreversible.
 *
 * @apiName DeleteAccount
 * @apiGroup auth
 * 
 * @apiParam {String} id The unique ID of the account to delete
 *
 * @apiSuccess (Success 200) {String} messageSuccess "Account successfully deleted."
 *
 * @apiError (404: User Not Found) {String} messageNotFound "User not found. Ensure you are logged in with the correct account."
 * @apiError (400: Invalid Request) {String} messageFailure "Invalid request. Please ensure all required fields are provided."
 *
 */

deleteAccountRouter.delete(
    '/account',
    (request: Request, response: Response, next: NextFunction) => {
        if (isAccountProvided(request.params.id)) {
            next();
        } else {
            response.status(400).send({
                messageFailure: 'Invalid request. Please ensure all required fields are provided.'
            });
        }
    },
    (request: Request, response: Response) => {
        const theQuery = 'DELETE FROM Account WHERE Account_ID = $1';
        const values = [request.params.id];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount === 0) {
                    response.status(404).send({
                        messageNotFound: 'User not found. Ensure you are logged in with the correct account.'
                    });
                } else{
                    response.status(200).send({
                        messageSuccess: 'Account successfully deleted.'
                    });
                }
            })
            .catch((error) => {
                response.status(500).send({
                    message: 'An error occurred while trying to delete associations',
                    error: error.message
                });
            });
    }
);

export { deleteAccountRouter };