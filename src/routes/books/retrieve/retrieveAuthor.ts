/**
 * @api {get} /Author Request to retrieve all the entries by Author (using pagination)
 *
 * @apiName GetAuthor
 * @apiGroup retrieve
 *
 * @apiParam {String} Author the author in which we will look up
 *
 * @apiSuccess (Success 200) {Object []} books List of books by the author (Book_ID, Title, ISBN, and Publication_Year).
 * @apiSuccess (Success 200) {number} BookID unique book id
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
 * @apiError (400: Invalid Author) {String} message "Invalid or missing author - please ensure that param is entered and is valid"
 * @apiError (404: Author Not Found) {String} message "Author Not Found"
 *
 */
