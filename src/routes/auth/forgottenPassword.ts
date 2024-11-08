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
 * @apiError (400: Missing Parameters) {String} messageFailure "Email or password missing - please ensure both fields are entered."
 * @apiError (404: Not Found) {String} messageNotFound "No account found with this email."
 * @apiError (400: Weak Password) {String} messageWeakPassword "The password is too weak. Ensure it meets the required complexity."
 *
 */
