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
 * @apiError (500: Internal Server Error) {String} messageServerError "An error occurred while deleting your account. Please try again later."
 * @apiError (400: Invalid Request) {String} messageInvalidRequest "Invalid request. Please ensure all required fields are provided."
 *
 */
