/**
 * @api {get} /ISBN Request to retrieve an entry by ISBN
 *
 * @apiName GetISBN
 * @apiGroup retrieve
 *
 * @apiParam {Number} ISBN the ISBN in which we will look up
 *
 * @apiSuccess (Success 200) {number} Book_ID unique book id
 * @apiSuccess (Success 200) {String} Title the book title
 * @apiSuccess (Success 200) {INT} Publication_Year the year the book was published
 * @apiSuccess (Success 200) {String} Author the authors of the book
 *
 * @apiError (400: Invalid ISBN) {String} message "invalid or missing ISBN"
 * @apiError (404: ISBN Not Found) {String} message "ISBN not found"
 *
 */
