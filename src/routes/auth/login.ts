// express is the framework we're going to use to handle requests
import express, { Request, Response, Router, NextFunction } from 'express';

import jwt from 'jsonwebtoken';

import {
    pool,
    validationFunctions,
    credentialingFunctions,
} from '../../core/utilities';

export interface Auth {
    email: string;
    password: string;
}

export interface AuthRequest extends Request {
    auth: Auth;
}

const isStringProvided = validationFunctions.isStringProvided;
const generateHash = credentialingFunctions.generateHash;

const signinRouter: Router = express.Router();

const key = {
    secret: process.env.JSON_WEB_TOKEN,
};

/**
 * @api {post} /login User Login
 * @apiDescription Authenticates a user by verifying their email and password, then returns a JSON Web Token (JWT) upon successful login.
 *
 * @apiName PostLogin
 * @apiGroup Auth
 *
 * @apiBody {String} email The email address associated with the user's account. **Required.**
 * @apiBody {String} password The user's password. **Required.**
 *
 * @apiSuccess {String} accessToken JSON Web Token that grants access to the system, valid for 14 days.
 * @apiSuccess {Number} id The unique user ID of the authenticated user.
 *
 * @apiError (400 Missing Information) {String} message "Missing required information" - Returned if the `email` or `password` fields are missing.
 * @apiError (400 Bad Request) {String} message "Malformed Authorization Header" - Returned if the authorization header is incorrectly formatted.
 * @apiError (404 Not Found) {String} message "User not found" - Returned if no user is found with the provided email.
 * @apiError (400 Password Mismatch) {String} message "Credentials did not match" - Returned if the provided password does not match the stored password.
 */
signinRouter.post(
    '/login',
    (request: AuthRequest, response: Response, next: NextFunction) => {
        if (
            isStringProvided(request.body.email) &&
            isStringProvided(request.body.password)
        ) {
            next();
        } else {
            response.status(400).send({
                message: 'Missing required information',
            });
        }
    },
    (request: AuthRequest, response: Response) => {
        const theQuery = `SELECT salted_hash, salt, Account_Credential.account_id, account.email, account.firstname, account.lastname, account.phone, account.username, account.account_role FROM Account_Credential
                      INNER JOIN Account ON
                      Account_Credential.account_id=Account.account_id 
                      WHERE Account.email=$1`;
        const values = [request.body.email];
        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount == 0) {
                    response.status(404).send({
                        message: 'User not found',
                    });
                    return;
                } else if (result.rowCount > 1) {
                    response.status(500).send({
                        message: 'server error - contact support',
                    });
                    return;
                }

                //Retrieve the salt used to create the salted-hash provided from the DB
                const salt = result.rows[0].salt;

                //Retrieve the salted-hash password provided from the DB
                const storedSaltedHash = result.rows[0].salted_hash;

                //Generate a hash based on the stored salt and the provided password
                const providedSaltedHash = generateHash(
                    request.body.password,
                    salt
                );

                //Did our salted hash match their salted hash?
                if (storedSaltedHash === providedSaltedHash) {
                    //credentials match. get a new JWT
                    const accessToken = jwt.sign(
                        {
                            name: result.rows[0].firstname,
                            role: result.rows[0].account_role,
                            id: result.rows[0].account_id,
                        },
                        key.secret,
                        {
                            expiresIn: '14 days', // expires in 14 days
                        }
                    );
                    //package and send the results
                    response.json({
                        accessToken,
                        id: result.rows[0].account_id,
                    });
                } else {
                    //credentials dod not match
                    response.status(400).send({
                        message: 'Credentials did not match',
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on sign in');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

export { signinRouter };
