/* eslint-disable @typescript-eslint/naming-convention */
import express, { Request, Response, Router } from 'express';
import { pool } from '../../../core/utilities';

const updateBookRouter: Router = express.Router();

/**
 * @api {update} /updateBook Update a book entry
 *
 * @apiDescription Request to update a book entry by ID.
 *
 * @apiName UpdateBook
 * @apiGroup update
 *
 * @apiParam {Number} Book_ID (Require this or ISBN13) The unique ID of the book to update.
 * @apiParam {BIGINT} ISBN13 (Require this or Book_ID) The ISBN for the book.
 * @apiParam {INT} Publication_Year The year the book was published.
 * @apiParam {Text} Title The title of the book.
 * @apiParam {TEXT} Authors of the book, comma separated.
 * @apiParam {TEXT} Image_URL The URL for an image for the book.
 * @apiParam {TEXT} Image_Small_URL A small URL for the book.
 *
 * @apiSuccess (Success 200) {String} message "Book successfully updated"
 *
 * @apiError (400: Missing Required Field) {String} message "Missing required field - please ensure that the request includes at least either Book_ID or ISBN"
 * @apiError (400: Invalid Book_ID) {String} message "Invalid book ID - please ensure that the book ID is a non-negative integer associated with a rating entry"
 * @apiError (400: Invalid ISBN) {String} message "Invalid ISBN - please ensure that the ISBN is a 13 digit non-negative integer associated with a rating entry"
 * @apiError (404: Book Not Found) {String} message "Book entry not found - please ensure the provided Book_ID and/or ISBN is associated with a book entry"
 * @apiError (400: Invalid Identifiers) {String} "Invalid Book_ID / ISBN combination - please ensure the identifiers coordinate to a single rating entry"
 * @apiError (400: No Fields To Update) message "No fields to update - please include at least one field to update"
 * @apiError (400: Invalid Publication Year) {String} message "Invalid Publication Year - please ensure the year is a valid positive integer less than or equal to the current year"
 * @apiError (400: Invalid Title) {String} message "Invalid Title - please ensure that the title is a valid string"
 * @apiError (400: Invalid Authors) {String} message "Invalid Authors - please ensure that the authors are provided as a comma-separated string"
 * @apiError (400: Invalid Image_URL) {String} message "Invalid Image URL - please ensure that the URL is valid"
 * @apiError (400: Invalid Image_Small_URL) {String} message "Invalid Image Small URL - please ensure that the URL is valid"
 *
 */
updateBookRouter.put(
    '/updateBook',
    async (request: Request, response: Response) => {
        const {
            Book_ID,
            ISBN13,
            Publication_Year,
            Title,
            Authors,
            Image_URL,
            Image_Small_URL,
        } = request.body;

        if (!Book_ID && !ISBN13) {
            response.status(400).send({
                message:
                    'Missing required field - please ensure that the request includes at least either Book_ID or ISBN',
            });
        }

        if (Book_ID && (typeof Book_ID !== 'number' || Book_ID < 0)) {
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

        let bookQuery = 'SELECT * FROM Books WHERE ';
        const params: (string | number)[] = [];
        if (Book_ID) {
            bookQuery += 'Book_ID = $1';
            params.push(Book_ID);
        }
        if (ISBN13) {
            bookQuery += Book_ID ? ' AND ISBN13 = $2' : 'ISBN13 = $1';
            params.push(ISBN13);
        }

        try {
            const bookResult = await pool.query(bookQuery, params);
            if (bookResult.rows.length === 0) {
                response.status(404).send({
                    message:
                        'Book entry not found - please ensure the provided ID and/or ISBN is associated with a book entry',
                });
            }
            if (Book_ID && ISBN13 && bookResult.rows[0].ISBN13 !== ISBN13) {
                response.status(400).send({
                    message:
                        'Invalid Book_ID / ISBN combination - please ensure the identifiers coordinate to a single rating entry',
                });
            }

            const updates = [];
            const values: (string | number)[] = [];
            let counter = 1;
            if (Publication_Year !== undefined) {
                updates.push(`Publication_Year = $${counter++}`);
                values.push(Publication_Year);
            }
            if (Title) {
                updates.push(`Title = $${counter++}`);
                values.push(Title);
            }
            if (Authors) {
                updates.push(`Authors = $${counter++}`);
                values.push(Authors);
            }
            if (Image_URL) {
                updates.push(`Image_URL = $${counter++}`);
                values.push(Image_URL);
            }
            if (Image_Small_URL) {
                updates.push(`Image_Small_URL = $${counter++}`);
                values.push(Image_Small_URL);
            }

            if (updates.length === 0) {
                response.status(400).send({
                    message:
                        'No fields to update - please include at least one field to update',
                });
            }

            if (
                Publication_Year !== undefined &&
                (typeof Publication_Year !== 'number' ||
                    Publication_Year < 1 ||
                    Publication_Year > new Date().getFullYear())
            ) {
                response.status(400).send({
                    message:
                        'Invalid Publication Year - please ensure the year is a valid positive integer less than or equal to the current year',
                });
            }

            if (Title && (typeof Title !== 'string' || Title.trim() === '')) {
                response.status(400).send({
                    message:
                        'Invalid Title - please ensure that the title is a valid string',
                });
            }

            if (Authors && typeof Authors !== 'string') {
                response.status(400).send({
                    message:
                        'Invalid Authors - please ensure that the authors are provided as a comma-separated string',
                });
            }

            if (Image_URL && !/^https?:\/\/\S+\.\S+$/.test(Image_URL)) {
                response.status(400).send({
                    message:
                        'Invalid Image URL - please ensure that the URL is valid',
                });
            }

            if (
                Image_Small_URL &&
                !/^https?:\/\/\S+\.\S+$/.test(Image_Small_URL)
            ) {
                response.status(400).send({
                    message:
                        'Invalid Image Small URL - please ensure that the URL is valid',
                });
            }

            const updateQuery = `UPDATE Books SET ${updates.join(', ')} WHERE ${Book_ID ? `Book_ID = $${counter}` : `ISBN13 = $${counter}`}`;
            values.push(Book_ID || ISBN13);

            await pool.query(updateQuery, values);
            response.status(200).send({ message: 'Book successfully updated' });
        } catch (error) {
            console.error('Database error:', error);
            response
                .status(500)
                .send({ message: 'Server error - contact support' });
        }
    }
);

export { updateBookRouter };
