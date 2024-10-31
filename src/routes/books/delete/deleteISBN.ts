/**
 * @api {delete} /book/:isbn Delete a book by ISBN
 *
 * @apiDescription Request to delete a book by its ISBN.
 *
 * @apiName DeleteISBN
 * @apiGroup delete
 *
 * @apiParam {Number} isbn The ISBN of the book to delete.
 *
 * @apiSuccess (Success 200) {string} messageSuccess "Book successfully deleted"
 *
 * @apiError (400: Missing ISBN) {String} messageFailure "Missing or invalid ISBN parameter - please ensure that the ISBN is valid and/or entered"
 * @apiError (404: Not Found) {String} messageNotFound "Book not found"
 *
 */
