/**
 * @api {update} /books/:id Update a book entry
 *
 * @apiDescription Request to update a book entry by ID.
 *
 * @apiName UpdateBook
 * @apiGroup update
 *
 * @apiParam {Number} Book_ID The unique ID of the book to update.
 * @apiParam {BIGINT} ISBN13 The ISBN for the book.
 * @apiParam {INT} Publication_Year The year the book was published.
 * @apiParam {Text} Title The title of the book.
 * @apiParam {FLOAT} Rating_Avg The average rating for the book.
 * @apiParam {INT} Rating_Count The count of ratings for the book.
 * @apiParam {TEXT} Image_URL The URL for an image for the book.
 * @apiParam {TEXT} Image_Small_URL A small URL for the book.
 *
 * @apiSuccess (Success 200) {String} message "Book successfully updated"
 * @apiSuccess (Success 200) {Number} Book_ID The ID of the updated book
 *
 * @apiError (400: Missing ID) {String} message "Missing or invalid book ID  - please ensure that the book ID is entered and/or valid "
 * @apiError (404: Not Found) {String} message "Book not found"
 *
 */