import express, { Request, Response, Router, NextFunction } from 'express';
import { pool, validationFunctions, credentialingFunctions } from '../../core/utilities';

const { isValidPassword, isValidEmail, isStringProvided } = validationFunctions;
const { generateHash, generateSalt } = credentialingFunctions;

const forgottenPasswordRouter: Router = express.Router();

interface ForgottenPasswordRequest extends Request {
    body: {
        email: string;
        newPassword: string;
    };
}

/**
 * @api {post} /forgottenPassword Reset Forgotten Password
 *
 * @apiDescription Allows a user who has forgotten their password to reset it by providing their email and a new password. The new password must meet specific complexity requirements for security.
 *
 * @apiName ResetForgottenPassword
 * @apiGroup Auth
 *
 * @apiBody {String} email The email address associated with the user's account. **Required.**
 * @apiBody {String} newPassword The new password the user wants to set. **Password Requirements:**
 *      - Minimum length of 8 characters
 *      - Must contain:
 *          - At least one uppercase letter
 *          - At least one lowercase letter
 *          - At least one special character (e.g., @, $, !, #)
 *          - At least one number
 *
 * @apiSuccess (200 OK) {String} message "Password successfully reset." - Indicates that the password has been reset successfully.
 *
 * @apiError (400 Missing Information) {String} message "Email and new password are required fields." - Returned if either the `email` or `newPassword` fields are missing in the request body.
 * @apiError (400 Invalid email) {String} message "Invalid email format - please ensure a valid email address is entered." - Returned if the `email` does not match a valid email format.
 * @apiError (400 Weak Password) {String} message "The password is too weak. Ensure it meets the required complexity." - Returned if the `newPassword` does not meet the specified complexity requirements.
 * @apiError (404 Not Found) {String} message "No account found with this email." - Returned if there is no account associated with the provided `email`.
 */
forgottenPasswordRouter.post(
    '/forgottenPassword',
    async (request: ForgottenPasswordRequest, response: Response, next: NextFunction) => {
        const { email, newPassword } = request.body;
        
        // Validate inputs
        if (!isStringProvided(email) || !isStringProvided(newPassword)) {
            return response.status(400).send({
                message: 'Email and new password are required fields.'
            });
        }
        
        if (!isValidEmail(email)) {
            return response.status(400).send({
                message: 'Invalid email format - please ensure a valid email address is entered.'
            });
        }
        
        if (!isValidPassword(newPassword)) {
            return response.status(400).send({
                message: 'The password is too weak. Ensure it meets the required complexity.'
            });
        }

        try {
            const query = 'SELECT account_id FROM Account WHERE email = $1';
            const result = await pool.query(query, [email]);

            if (result.rowCount === 0) {
                return response.status(404).send({
                    message: 'No account found with this email.'
                });
            }

            const accountId = result.rows[0].account_id;

            const newSalt = generateSalt(32);
            const newSaltedHash = generateHash(newPassword, newSalt);

            const updateQuery = `
                UPDATE Account_Credential
                SET salted_hash = $1, salt = $2
                WHERE account_id = $3
            `;
            await pool.query(updateQuery, [newSaltedHash, newSalt, accountId]);

            response.status(200).send({
                message: 'Password successfully reset.'
            });
        } catch (error) {
            console.error('Error during forgotten password reset:', error);
            response.status(500).send({
                message: 'An error occurred during password reset. Please try again later.'
            });
        }
    }
);

export { forgottenPasswordRouter };
