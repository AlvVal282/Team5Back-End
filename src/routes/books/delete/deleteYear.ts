/**
 * @api {delete} /year/:year Delete a specified year
 *
 * @apiDescription Request to delete all books associated of a specific publication year from the database.
 *
 * @apiName DeleteYear
 * @apiGroup delete
 *
 * @apiParam {Number} Publication_Year The publication year to delete.
 *
 * @apiSuccess (Success 200) {String} messageSuccess "All books associated with publication year successfully deleted"
 *
 * @apiError (400: Missing Year) {String} messageFailure "Missing or invalid year parameter  - please ensure the publication year is entered and/or correctly formatted"
 * @apiError (404: Year Not Found) {String} messageNotFound "No books found for the specified publication year"
 */
