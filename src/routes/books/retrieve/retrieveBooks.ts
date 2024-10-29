/**
 * @api {get} /books Request to retrieve all books (with pagination)
 *
 * @apiName GetBooks
 * @apiGroup retrieve
 *
 * @apiParam {Number} page The page number of the result set.
 * @apiParam {Number} limit The number of results to display per page.
 *
 * @apiSuccess (Success 200) {Object []} books List of all books (each contains Book_ID, Title, ISBN, and Publication_Year).
 * @apiSuccess (Success 200) {Number} total The total number of books.
 * @apiSuccess (Success 200) {Number} pages The total number of pages.
 *
 * @apiError (404: Books Not Found) {String} message "No books found"
 *
 */
