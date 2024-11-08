import express, { Request, Response, Router, NextFunction } from 'express';
import { pool, validationFunctions, credentialingFunctions } from '../../core/utilities';

const { isValidPassword, isStringProvided } = validationFunctions;
const { generateHash, generateSalt } = credentialingFunctions;

const resetPasswordRouter: Router = express.Router();

interface ResetPasswordRequest extends Request {
    body: {
        email: string;
        currentPassword: string;
        newPassword: string;
    };
}

const key = {
    secret: process.env.JSON_WEB_TOKEN,
};

/**
 * @api {post} /reset Reset Password
 * @apiDescription Allows a user to reset their password by providing their current password and a new password. The new password must meet specific complexity requirements for security.
 *
 * @apiName ResetPassword
 * @apiGroup Auth
 *
 * @apiBody {String} email The email address associated with the user's account. **Required.**
 * @apiBody {String} currentPassword The user's current password. **Required.**
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
 * @apiError (400 Bad Request) {String} message "Missing required information" - Returned if any of the required fields are missing.
 * @apiError (400 Bad Request) {String} message "Invalid or missing password - please adhere to the password rules shown." - Returned if the `newPassword` does not meet the specified complexity requirements.
 * @apiError (401 Unauthorized) {String} message "Old password is incorrect - please ensure password is correctly typed." - Returned if the provided `currentPassword` does not match the stored password.
 * @apiError (404 Not Found) {String} message "No account found with this email." - Returned if there is no account associated with the provided `email`.
 * @apiError (500 Internal Server Error) {String} message "An error occurred during password reset. Please try again later." - Returned if a server error occurs.
 */
resetPasswordRouter.post(
    '/resetPassword',
    async (request: ResetPasswordRequest, response: Response, next: NextFunction) => {
        const { email, currentPassword, newPassword } = request.body;
        
        // Validate inputs
        if (!isStringProvided(email) || !isStringProvided(currentPassword) || !isStringProvided(newPassword)) {
            return response.status(400).send({
                message: 'Missing required information',
            });
        }
        
        if (!isValidPassword(newPassword)) {
            return response.status(400).send({
                message: 'Invalid or missing password - please adhere to the password rules shown.',
            });
        }

        try {
            const query = `
                SELECT Account_Credential.salted_hash, Account_Credential.salt, Account_Credential.account_id 
                FROM Account_Credential
                INNER JOIN Account ON Account_Credential.account_id = Account.account_id 
                WHERE Account.email = $1
            `;

            const result = await pool.query(query, [email]);

            if (result.rowCount === 0) {
                return response.status(404).send({
                    message: 'No account found with this email.',
                });
            }

            const { salted_hash: storedHash, salt, account_id: accountId } = result.rows[0];

            // Generate hash based on stored salt and provided current password
            const providedHash = generateHash(currentPassword, salt);
            if (storedHash !== providedHash) {
                return response.status(401).send({
                    message: 'Old password is incorrect - please ensure password is correctly typed.',
                });
            }

            // Generate new salt and hashed password for update
            const newSalt = generateSalt(32);
            const newSaltedHash = generateHash(newPassword, newSalt);

            const updateQuery = `
                UPDATE Account_Credential
                SET salted_hash = $1, salt = $2
                WHERE account_id = $3
            `;
            await pool.query(updateQuery, [newSaltedHash, newSalt, accountId]);

            response.status(200).send({
                message: 'Password successfully reset.',
            });
        } catch (error) {
            console.error('Error during password reset:', error);
            response.status(500).send({
                message: 'An error occurred during password reset. Please try again later.',
            });
        }
    }
);

export { resetPasswordRouter };

