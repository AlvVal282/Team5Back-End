/**
 * @api {update} /books/rating Update a book rating
 *
 * @apiDescription Request to update a book rating by ID.
 *
 * @apiName UpdateBookRating
 * @apiGroup update
 *
 * @apiParam {Number} Rating_ID The unique ID of the book rating to update.
 *
 * @apiSuccess (Success 200) {String} message "Book rating successfully updated"
 * @apiSuccess (Success 200) {Number} Rating_ID The ID of the updated book rating
 *
 * @apiError (400: Missing ID) {String} message "Missing or invalid rating ID  - please ensure that the rating ID is entered and/or valid "
 * @apiError (404: Not Found) {String} message "Book rating not found"
 *
 */