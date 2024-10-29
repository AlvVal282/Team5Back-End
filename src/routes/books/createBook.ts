/**
 * @api {create} /books/add Create a book entry
 *
 * @apiDescription Request to create a book entry by ID.
 *
 * @apiName AddBook
 * @apiGroup create
 *
 * @apiParam {NUMBER} Book_ID The unique ID of the book.
 * @apiParam {BIGINT} ISBN13 The ISBN for the book.
 * @apiParam {INT} Publication_Year The year the book was published.
 * @apiParam {Text} Title The title of the book.
 * @apiParam {FLOAT} Rating_Avg The average rating for the book.
 * @apiParam {INT} Rating_Count The count of ratings for the book.
 * @apiParam {TEXT} Image_URL The URL for an image for the book.
 * @apiParam {TEXT} Image_Small_URL A small URL for the book.  
 *
 * @apiSuccess (Success 200) {String} message "Book successfully created"
 *
 * @apiError (400: Missing ID) {String} message "Missing or invalid book ID  - please ensure that the book ID is entered and/or valid "
 * @apiError (400: Missing ID) {String} message "Missing or invalid book ID  - please ensure that the book ID is entered and/or valid "
 *
 */