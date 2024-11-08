/* eslint-disable @typescript-eslint/naming-convention */
import express, { Request, Response, Router } from 'express';
import { pool } from '../../../core/utilities';

const updateRatingRouter: Router = express.Router();

/**
 * @api {put} /updateRating Update a book rating
 *
 * @apiDescription Request to update a book rating. Request must include either Book_ID associated with the book rating(s) to be updated.
 *
 * @apiName UpdateBookRatingID
 * @apiGroup update
 *
 * @apiParam {NUMBER} Book_ID (Requirement option) The unique Book_ID for the book rating to update.
 * @apiParam {NUMBER} ISBN13 (Requirement option) The unique ISBN for the book rating to update.
 * @apiParam {FLOAT} Rating_Avg The average rating for the book.
 * @apiParam {INT} Rating_Count The count of ratings for the book.
 * @apiParam {INT} One_Star_Count The count of 1 star ratings for the book.
 * @apiParam {INT} Two_Star_Count The count of 2 star ratings for the book.
 * @apiParam {INT} Three_Star_Count The count of 3 star ratings for the book.
 * @apiParam {INT} Four_Star_Count The count of 4 star ratings for the book.
 * @apiParam {INT} Five_Star_Count The count of 5 star ratings for the book.
 *
 * @apiSuccess (Success 200) {String} message "Book rating successfully updated"
 *
 * @apiError (400: Missing Required Field) {String} message "Missing required field - please ensure that the request includes at least either Book_ID or ISBN"
 * @apiError (400: Invalid Book_ID) {String} message "Invalid book ID - please ensure that the book ID is a non-negative integer associated with a rating entry"
 * @apiError (400: Invalid ISBN) {String} message "Invalid ISBN - please ensure that the ISBN is a 13 digit non-negative integer associated with a rating entry"
 * @apiError (404: Rating Entry Not Found) {String} message "Rating entry not found - please ensure the provided identifiers are associated with a rating entry"
 * @apiError (400: Invalid Identifiers) {String} message "Invalid Book_ID / ISBN combination - please ensure the provided identifiers coordinate to a single rating entry"
 * @apiError (400: No fields to update) message "No fields to update - please include at least one field to update"
 * @apiError (400: Invalid Rating Average) {String} message "Invalid rating average - please ensure that the rating average is a number between 0 and 5 and calculated correctly based on star counts"
 * @apiError (400: Invalid Rating Count) {String} message "Invalid rating count - please ensure that the rating count is a non-negative integer equal to the sum of all star counts"
 * @apiError (400: Invalid One_Star_Count) {String} message "Invalid 1 star count - please ensure that the 1 star count is a non-negative integer"
 * @apiError (400: Invalid Two_Star_Count) {String} message "Invalid 2 star count - please ensure that the 2 star count is a non-negative integer"
 * @apiError (400: Invalid Three_Star_Count) {String} message "Invalid 3 star count - please ensure that the 3 star count is a non-negative integer"
 * @apiError (400: Invalid Four_Star_Count) {String} message "Invalid 4 star count - please ensure that the 4 star count is a non-negative integer"
 * @apiError (400: Invalid Five_Star_Count) {String} message "Invalid 5 star count - please ensure that the 5 star count is a non-negative integer"
 * @apiError (500: Server Error) {String} message "Server error - contact support"
 */

updateRatingRouter.put(
    '/updateRating',
    async (request: Request, response: Response) => {
        const {
            Book_ID,
            ISBN13,
            Rating_Avg,
            Rating_Count,
            One_Star_Count,
            Two_Star_Count,
            Three_Star_Count,
            Four_Star_Count,
            Five_Star_Count,
        } = request.body;

        if (!Book_ID && !ISBN13) {
            return response.status(400).send({
                message:
                    'Missing required field - please ensure that the request includes at least either Book_ID or ISBN',
            });
        }

        if (Book_ID && typeof Book_ID !== 'number') {
            response.status(400).send({
                message:
                    'Invalid book ID - please ensure that the book ID is a non-negative integer associated with a rating entry',
            });
        }

        if (ISBN13 && !/^\d{13}$/.test(String(ISBN13))) {
            response.status(400).send({
                message:
                    'Invalid ISBN - please ensure that the ISBN is a 13 digit non-negative integer associated with a rating entry',
            });
        }

        let selectQuery =
            'SELECT br.* FROM Book_Ratings br INNER JOIN Books b ON br.Book_ID = b.Book_ID WHERE ';
        const params: (string | number)[] = [];
        const conditions = [];
        if (Book_ID) {
            conditions.push(
                `${params.length ? 'br.Book_ID = $2' : 'br.Book_ID = $1'}`
            );
            params.push(Book_ID);
        }
        if (ISBN13) {
            conditions.push(
                `${params.length ? 'b.ISBN13 = $3' : 'b.ISBN13 = $1'}`
            );
            params.push(ISBN13);
        }
        selectQuery += conditions.join(' AND ');

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const ratingResults = await client.query(selectQuery, params);

            if (ratingResults.rows.length === 0) {
                await client.query('ROLLBACK');
                response.status(404).send({
                    message:
                        'Rating entry not found - please ensure the provided identifiers are associated with a rating entry',
                });
            }
            if (ratingResults.rows.length > 1) {
                await client.query('ROLLBACK');
                response.status(400).send({
                    message:
                        'Invalid Book_ID / ISBN combination - please ensure the provided identifiers coordinate to a single rating entry',
                });
            }

            const booksUpdates = [];
            const booksValues: (string | number)[] = [];
            let booksCounter = 1;
            if (Rating_Avg !== undefined) {
                booksUpdates.push(`Rating_Avg = $${booksCounter++}`);
                booksValues.push(Rating_Avg);
            }
            if (Rating_Count !== undefined) {
                booksUpdates.push(`Rating_Count = $${booksCounter++}`);
                booksValues.push(Rating_Count);
            }

            const ratingUpdates = [];
            const ratingValues: (string | number)[] = [];
            let ratingCounter = 1;
            if (One_Star_Count !== undefined) {
                ratingUpdates.push(`Rating_1_Star = $${ratingCounter++}`);
                ratingValues.push(One_Star_Count);
            }
            if (Two_Star_Count !== undefined) {
                ratingUpdates.push(`Rating_2_Star = $${ratingCounter++}`);
                ratingValues.push(Two_Star_Count);
            }
            if (Three_Star_Count !== undefined) {
                ratingUpdates.push(`Rating_3_Star = $${ratingCounter++}`);
                ratingValues.push(Three_Star_Count);
            }
            if (Four_Star_Count !== undefined) {
                ratingUpdates.push(`Rating_4_Star = $${ratingCounter++}`);
                ratingValues.push(Four_Star_Count);
            }
            if (Five_Star_Count !== undefined) {
                ratingUpdates.push(`Rating_5_Star = $${ratingCounter++}`);
                ratingValues.push(Five_Star_Count);
            }

            if (ratingUpdates.length === 0 && booksUpdates.length === 0) {
                return response.status(400).send({
                    message:
                        'No fields to update - please include at least one field to update',
                });
            }

            const starCounts = [
                One_Star_Count,
                Two_Star_Count,
                Three_Star_Count,
                Four_Star_Count,
                Five_Star_Count,
            ];
            for (let i = 0; i < starCounts.length; i++) {
                if (
                    starCounts[i] !== undefined &&
                    (typeof starCounts[i] !== 'number' ||
                        starCounts[i] < 0 ||
                        !Number.isInteger(starCounts[i]))
                ) {
                    response.status(400).send({
                        message: `Invalid ${i + 1} star count - please ensure that the ${i + 1} star count is a non-negative integer`,
                    });
                }
            }

            const existingData = ratingResults.rows[0];
            const calculatedCount =
                (One_Star_Count ?? existingData.Rating_1_Star) +
                (Two_Star_Count ?? existingData.Rating_2_Star) +
                (Three_Star_Count ?? existingData.Rating_3_Star) +
                (Four_Star_Count ?? existingData.Rating_4_Star) +
                (Five_Star_Count ?? existingData.Rating_5_Star);

            if (
                Rating_Count !== undefined &&
                Rating_Count !== calculatedCount
            ) {
                await client.query('ROLLBACK');
                response.status(400).send({
                    message:
                        'Invalid rating count - please ensure that the rating count is a non-negative integer equal to the sum of all star counts',
                });
            }

            const calculatedAvg =
                (1 * (One_Star_Count ?? existingData.Rating_1_Star) +
                    2 * (Two_Star_Count ?? existingData.Rating_2_Star) +
                    3 * (Three_Star_Count ?? existingData.Rating_3_Star) +
                    4 * (Four_Star_Count ?? existingData.Rating_4_Star) +
                    5 * (Five_Star_Count ?? existingData.Rating_5_Star)) /
                calculatedCount;

            if (Rating_Avg !== undefined && Rating_Avg !== calculatedAvg) {
                await client.query('ROLLBACK');
                response.status(400).send({
                    message:
                        'Invalid rating average - please ensure that the rating average is a number between 0 and 5 and calculated correctly based on star counts',
                });
            }

            if (Rating_Count === undefined) {
                booksUpdates.push(`Rating_Count = $${booksCounter++}`);
                booksValues.push(calculatedCount);
            }
            if (Rating_Avg === undefined) {
                booksUpdates.push(`Rating_Avg = $${booksCounter++}`);
                booksValues.push(calculatedAvg);
            }

            const updateRatingQuery = `UPDATE Book_Ratings SET ${ratingUpdates.join(', ')} WHERE Book_ID = $${ratingCounter}`;
            ratingValues.push(ratingResults.rows[0].Book_ID);

            await client.query(updateRatingQuery, ratingValues);

            const updateBooksQuery = `UPDATE Book_Ratings SET ${booksUpdates.join(', ')} WHERE Book_ID = $${booksCounter}`;
            booksValues.push(ratingResults.rows[0].Book_ID);

            await client.query(updateBooksQuery, booksValues);

            await client.query('COMMIT');

            response
                .status(200)
                .send({ message: 'Book rating successfully updated' });
        } catch (error) {
            await client.query('ROLLBACK');
            //console.error('Database error:', error);
            response
                .status(500)
                .send({ message: 'Server error - contact support' });
        } finally {
            client.release();
        }
    }
);

export { updateRatingRouter };
