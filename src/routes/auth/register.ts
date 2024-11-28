// express is the framework we're going to use to handle requests
import express, { Request, Response, Router, NextFunction } from 'express';

import jwt from 'jsonwebtoken';

const key = {
    secret: process.env.JSON_WEB_TOKEN,
};

import {
    pool,
    validationFunctions,
    credentialingFunctions,
} from '../../core/utilities';

const isStringProvided = validationFunctions.isStringProvided;
const isNumberProvided = validationFunctions.isNumberProvided;
const isValidEmail = validationFunctions.isValidEmail;
const isValidPassword = validationFunctions.isValidPassword;
const isValidPhone = validationFunctions.isValidPhone;
const isValidRole = validationFunctions.isValidRole;
const generateHash = credentialingFunctions.generateHash;
const generateSalt = credentialingFunctions.generateSalt;

const registerRouter: Router = express.Router();

// Define the user registration body interface
interface IUserRegistrationData {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    username: string;
    role: string;
    phone: string;
}

// Extend the Request interface to use IUserRegistrationData
export interface IUserRequest extends Request {
    body: IUserRegistrationData;  // Add the body with the custom interface
    id: number;
}

// Now your middleware and handlers will recognize the body property correctly.


// middleware functions may be defined elsewhere!
const emailMiddlewareCheck = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    if (isValidEmail(request.body.email)) {
        next();
    } else {
        response.status(400).send({
            message:
                'Invalid or missing email - please include @ symbol and end with a proper domain (e.g., user@example.com)',
        });
    }
};

/**
 * @api {post} /register Register a new user
 *
 * @apiDescription This endpoint allows a new user to register by providing their personal details, role, and secure password. The password must meet specific complexity rules, and the chosen role must match predefined roles.
 *
 * @apiName PostRegister
 * @apiGroup Auth
 *
 * @apiBody {String} firstname The user's first name.
 * @apiBody {String} lastname The user's last name.
 * @apiBody {String} email The user's unique email address.
 * @apiBody {String} password The user's chosen password. **Password Requirements:**
 *      - Minimum length of 8 characters
 *      - Must contain:
 *          - At least one uppercase letter
 *          - At least one lowercase letter
 *          - At least one special character (e.g., @, $, !, #)
 *          - At least one number
 * @apiBody {String} username A unique username for the user.
 * @apiBody {String} role The user's role in the system. **Role Options:**
 *      - "1" - Admin
 *      - "2" - Manager
 *      - "3" - Developer
 *      - "4" - Account User
 *      - "5" - Anonymous User
 * @apiBody {String} phone The user's phone number, which must be exactly 10 numerical digits.
 *
 * @apiSuccess {String} accessToken JSON Web Token that grants access to the system, valid for 14 days.
 * @apiSuccess {Object} a user object
 * @apiSuccess {String} user.name the first name associated with username
 * @apiSuccess {String} user.email The email associated with username
 * @apiSuccess {String} user.role The role associated with username 
 * @apiSuccess {String} user.id The internal user id associated with username
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information" - Returned if firstname, lastname, or username is missing.
 * @apiError (400: Invalid Email) {String} message "Invalid or missing email - please include '@' symbol and end with a proper domain (e.g., user@example.com)" - Returned if the email format is invalid.
 * @apiError (400: Invalid Password) {String} message "Invalid or missing password - please adhere to the password rules shown" - Returned if the password does not meet complexity requirements.
 * @apiError (400: Invalid Phone) {String} message "Invalid or missing phone number - please only include numbers (e.g., 1234567890)" - Returned if the phone number is not exactly 10 digits.
 * @apiError (400: Invalid Role) {String} message "Invalid or missing role - please select a role for your account" - Returned if the role is not within the predefined options.
 * @apiError (400: Username Exists) {String} message "Username exists" - Returned if the chosen username is already taken.
 * @apiError (400: Email Exists) {String} message "Email exists" - Returned if the provided email is already associated with an existing account.
 */
registerRouter.post(
    '/register',
    emailMiddlewareCheck, // these middleware functions may be defined elsewhere!
    (request: Request, response: Response, next: NextFunction) => {
        //Verify that the caller supplied all the parameters
        //In js, empty strings or null values evaluate to false
        if (
            isStringProvided(request.body.firstname) &&
            isStringProvided(request.body.lastname) &&
            isStringProvided(request.body.username)
        ) {
            next();
        } else {
            response.status(400).send({
                message: 'Missing required information',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidPhone(request.body.phone)) {
            next();
            return;
        } else {
            response.status(400).send({
                message:
                    'please only include numbers (e.g., 1234567890)',
            });
            return;
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidPassword(request.body.password)) {
            next();
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing password - please adhere to the password rules shown',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        if (isValidRole(request.body.role)) {
            next();
        } else {
            response.status(400).send({
                message:
                    'Invalid or missing role - please select a role for your account',
            });
        }
    },
    (request: IUserRequest, response: Response, next: NextFunction) => {
        const theQuery =
            'INSERT INTO Account(Firstname, Lastname, Username, Email, Phone, Account_Role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING account_id';
        const values = [
            request.body.firstname,
            request.body.lastname,
            request.body.username,
            request.body.email,
            request.body.phone,
            request.body.role,
        ];
        pool.query(theQuery, values)
            .then((result) => {
                //stash the account_id into the request object to be used in the next function
                // NOTE the TYPE for the Request object in this middleware function
                request.id = result.rows[0].account_id;
                next();
            })
            .catch((error) => {
                //log the error
                // console.log(error)
                if (error.constraint == 'account_username_key') {
                    response.status(400).send({
                        message: 'Username exists',
                    });
                } else if (error.constraint == 'account_email_key') {
                    response.status(400).send({
                        message: 'Email exists',
                    });
                } else {
                    //log the error
                    console.error('DB Query error on register');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error when creating account - contact support',
                    });
                }
            });
    },
    (request: IUserRequest, response: Response) => {
        //We're storing salted hashes to make our application more secure
        //If you're interested as to what that is, and why we should use it
        //watch this youtube video: https://www.youtube.com/watch?v=8ZtInClXe1Q
        const salt = generateSalt(32);
        const saltedHash = generateHash(request.body.password, salt);

        const theQuery =
            'INSERT INTO Account_Credential(account_id, salted_hash, salt) VALUES ($1, $2, $3)';
        const values = [request.id, saltedHash, salt];
        pool.query(theQuery, values)
            .then(() => {
                const accessToken = jwt.sign(
                    {
                        role: request.body.role,
                        id: request.id,
                    },
                    key.secret,
                    {
                        expiresIn: '14 days', // expires in 14 days
                    }
                );
                //We successfully added the user!
                response.status(201).send({
                    accessToken,
                    user: {
                        email: request.body.email,
                        name: request.body.firstname,
                        role: request.body.role,
                        id: 1
                    }
                });
            })
            .catch((error) => {
                /***********************************************************************
                 * If we get an error inserting the PWD, we should go back and remove
                 * the user from the member table. We don't want a member in that table
                 * without a PWD! That implementation is up to you if you want to add
                 * that step.
                 **********************************************************************/

                //log the error
                console.error('DB Query error on register');
                console.error(error);
                response.status(500).send({
                    message: 'server error when saving password - contact support',
                });
            });
    }
);

registerRouter.get('/hash_demo', (request, response) => {
    const password = 'password12345';

    const salt = generateSalt(32);
    const saltedHash = generateHash(password, salt);
    const unsaltedHash = generateHash(password, '');

    response.status(200).send({
        salt: salt,
        salted_hash: saltedHash,
        unsalted_hash: unsaltedHash,
    });
});

export { registerRouter };
