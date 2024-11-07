import express, { Request, Response, Router, NextFunction } from 'express';

import {
    pool,
    validationFunctions,
} from '../../core/utilities';

const isAuthorProvided = validationFunctions.isAuthorOrYearProvided;
const isValidPassword = validationFunctions.isValidPassword;

const resetPasswordRouter: Router = express.Router();

/**
 * @api {post} /reset Request to reset password of the user in the system
 * 
 * @apiName ResetPassword
 * @apiGroup auth
 *
 * @apiBody {String} password, current password of user
 * @apiBody {String} updated password, new password of user
 *
 * @apiSuccess (Success 200) {String} message "Password successfully reset"
 *
 * @apiError (401: Unauthorized Password) {String} messageFailure "Old password is incorrect  - please insure password is correctly typed"
 * @apiError (400: Invalid Password) {String} message "Invalid or missing password  - please adhere to the password rules shown"
 *
 */

resetPasswordRouter.delete(
    '/reset',
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidPassword(request.params.oldPWD)) {
            next();
        } else {
            response.status(401).send({
                messageFailure: 'Old password is incorrect  - please insure password is correctly typed'
            });
        }
    },
    (request: Request, response: Response) => {
        const theQuery = 'DELETE FROM Book_Author WHERE Author_ID = $1';
        const values = [request.params.id];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount === 0) {
                    response.status(400).send({
                        message: `Invalid or missing password  - please adhere to the password rules shown`
                    });
                } else{
                    response.status(200).send({
                        messageSuccess: 'Password successfully reset'
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

export { resetPasswordRouter };
