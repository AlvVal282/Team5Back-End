/**
 * @api {get} /Author Request to retrieve all the entries by Author
 *
 * @apiName GetAuthor
 * @apiGroup retrieve
 *
 * @apiParam {String} Author the author in which we will look up
 *
 * @apiSuccess (Success 200) {Object []} books List of books by the author (Book_ID, Title, ISBN, and Publication_Year).
 * @apiSuccess (Success 200) {number} bookID unique book id
 * @apiSuccess (Success 200) {BIGINT} ISBN unique book ISBN
 * @apiSuccess (Success 200) {String} title the book title
 * @apiSuccess (Success 200) {INT} publication_Year the year book was published
 *
 * @apiError (400: Invalid Author) {String} message "invalid or missing Author"
 * @apiError (404: Author Not Found) {String} message "Author not found"
 *
 */
