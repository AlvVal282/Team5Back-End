import express, { Request, Response, Router, NextFunction } from 'express';

import {
    pool,
    validationFunctions,
} from '../../core/utilities';

const isAuthorProvided = validationFunctions.isAuthorOrYearProvided;
const isValidPassword = validationFunctions.isValidPassword;
const isValidEmail = validationFunctions.isValidEmail;

const forgottenPasswordRouter: Router = express.Router();

/**
 * @api {post} /forgottenPassword Reset forgotten password
 *
 * @apiDescription Allows the user to reset their forgotten password by providing the email and new password.
 *
 * @apiName ResetForgottenPassword
 * @apiGroup auth
 *
 * @apiParam {String} email The email address associated with the user's account.
 * @apiParam {String} newPassword The new password the user wants to set.
 *
 * @apiSuccess (Success 200) {String} message "Password successfully reset."
 *
 * @apiError (400: Missing Parameters) {String} messageFailure "Email missing - please ensure both fields are entered."
 * @apiError (404: Not Found) {String} messageNotFound "No account found with this email."
 * @apiError (400: Weak Password) {String} messageWeakPassword "The password is too weak. Ensure it meets the required complexity."
 *
 */

forgottenPasswordRouter.delete(
    '/forgottenPassword',
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

export { forgottenPasswordRouter };