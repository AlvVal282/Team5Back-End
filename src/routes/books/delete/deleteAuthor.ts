/**
 * @api {delete} /author/:id Delete an author
 *
 * @apiDescription Request to delete an author by ID.
 *
 * @apiName DeleteAuthor
 * @apiGroup delete
 *
 * @apiParam {Number} Author_ID The unique ID of the author to delete.
 *
 * @apiSuccess (Success 200) {String} message "Author successfully deleted"
 * @apiSuccess (Success 200) {Number} Author_ID The ID of the deleted author
 *
 * @apiError (400: Missing ID) {String} message "Missing or invalid author ID  - please ensure that the Author is entered and/or valid "
 * @apiError (404: Not Found) {String} message "Author not found"
 *
 */

