/**
 * @api {post} /reset Request to reset password of the user in the system
 * 
 * @apiName PostLogin
 * @apiGroup Auth
 *
 * @apiBody {String} password, current password of user
 * @apiBody {String} updated password, new password of user
 *
 * @apiSuccess (Success 200) Password reset successful
 *
 * @apiError (401: Unauthorized Password) {String} message "Old password is incorrect  - please insure password is correctly typed"
 * @apiError (400: Invalid Password) {String} message "Invalid or missing password  - please adhere to the password rules shown"
 *
 */