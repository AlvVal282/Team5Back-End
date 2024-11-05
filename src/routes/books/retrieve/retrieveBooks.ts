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
 * @apiSuccess (Success 200) {Number} BookID unique book id
 * @apiSuccess (Success 200) {BIGINT} ISBN unique book ISBN 
 * @apiSuccess (Success 200) {INT} Publication_Year the year the book was published
 * @apiSuccess (Success 200) {String} Title the book title 
 * @apiSuccess (Success 200) {TEXT} Image_URL url of the books image 
 * @apiSuccess (Success 200) {Object} pagination Pagination metadata for the response
 * @apiSuccess (Success 200) {number} pagination.totalRecords Total number of books.
 * @apiSuccess (Success 200) {number} pagination.limit Number of entries returned per page.
 * @apiSuccess (Success 200) {number} pagination.offset Offset used for the current query.
 * @apiSuccess (Success 200) {number} pagination.nextPage Offset value to retrieve the next set of entries.
 *
 * @apiError (500 : failed connection to database) {String} message "Internal Server Error: Failed to connect to the database."
 *
 */
