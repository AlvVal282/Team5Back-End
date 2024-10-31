/**
 * @api {delete} /author/:id Delete an author
 *
 * @apiDescription Request to delete an author by ID.
 *
 * @apiName DeleteAuthor
 * @apiGroup delete
 *
 * @apiParam {Number} id The unique ID of the author to delete.
 *
 * @apiSuccess (Success 200) {String} messageSuccess "Author successfully deleted"
 *
 * @apiError (400: Missing ID) {String} messageFailure "Missing or invalid author ID  - please ensure that the Author is entered and/or valid"
 * @apiError (404: Not Found) {String} messageNotFound "Author not found"
 *
 */

