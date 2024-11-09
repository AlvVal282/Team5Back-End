/* eslint-disable @typescript-eslint/naming-convention */
import express, { Request, Response, Router } from 'express';
import { pool } from '../../../core/utilities';

const updateBookRouter: Router = express.Router();

/**
 * @api {update} /updateBook Update a book entry
 *
 * @apiDescription Request to update a book entry by ID. Does not update rating realted data. (Use /updateRating instead)
 *
 * @apiName UpdateBook
 * @apiGroup update
 *
 * @apiBody {Number} Book_ID (Require this or ISBN13) The unique ID of the book to update.
 * @apiBody {BIGINT} ISBN13 (Require this or Book_ID) The ISBN for the book.
 * @apiBody {INT} Publication_Year The year the book was published.
 * @apiBody {Text} Title The title of the book.
 * @apiBody {TEXT} Authors of the book, comma separated.
 * @apiBody {TEXT} Image_URL The URL for an image for the book.
 * @apiBody {TEXT} Image_Small_URL A small URL for the book.
 *
 * @apiSuccess (Success 200) {String} message "Book successfully updated"
 *
 * @apiError (400: Missing Required Field) {String} message "Missing required field - please ensure that the request includes at least either Book_ID or ISBN"
 * @apiError (400: Invalid Book_ID) {String} message "Invalid book ID - please ensure that the book ID is a positive integer associated with a book entry"
 * @apiError (400: Invalid ISBN) {String} message "Invalid ISBN - please ensure that the ISBN is a 13 digit integer beginning with 978 or 979 and is associated with a book entry"
 * @apiError (404: Book Not Found) {String} message "Book entry not found - please ensure the provided Book_ID and/or ISBN is associated with a book entry"
 * @apiError (400: Invalid Identifiers) {String} message "Invalid Book_ID / ISBN combination - please ensure the identifiers coordinate to a single rating entry"
 * @apiError (400: No Fields To Update) message "No fields to update - please include at least one field to update"
 * @apiError (400: Invalid Publication Year) {String} message "Invalid Publication Year - please ensure the year is a valid positive integer less than or equal to the current year"
 * @apiError (400: Invalid Title) {String} message "Invalid Title - please ensure that the title is a valid string"
 * @apiError (400: Invalid Authors) {String} message "Invalid Authors - please ensure that the authors are provided as a comma-separated string"
 * @apiError (400: Invalid Image_URL) {String} message "Invalid Image URL - please ensure that the URL is valid"
 * @apiError (400: Invalid Image_Small_URL) {String} message "Invalid Image Small URL - please ensure that the URL is valid"
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
            return response.status(400).send({
                message:
                    'Missing required field - please ensure that the request includes at least either Book_ID or ISBN',
            });
        }

        if (Book_ID && (typeof Book_ID !== 'number' || Book_ID <= 0)) {
            return response.status(400).send({
                message:
                    'Invalid book ID - please ensure that the book ID is a positive integer associated with a book entry',
            });
        }

        if (ISBN13 && !/^(978|979)\d{10}$/.test(String(ISBN13))) {
            return response.status(400).send({
                message:
                    'Invalid ISBN - please ensure that the ISBN is a 13 digit integer beginning with 978 or 979 and is associated with a book entry',
            });
        }

        let bookQuery = 'SELECT * FROM Books WHERE ';
        const params: (string | number)[] = [];
        if (Book_ID) {
            bookQuery += 'Book_ID = $1';
            params.push(Book_ID);
        }
        if (!Book_ID && ISBN13) {
            bookQuery += 'ISBN13 = $1';
            params.push(ISBN13);
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const bookResult = await client.query(bookQuery, params);
            if (bookResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return response.status(404).send({
                    message:
                        'Book entry not found - please ensure the provided Book_ID and/or ISBN is associated with a book entry',
                });
            }
            if (
                Book_ID &&
                ISBN13 &&
                (bookResult.rows[0].isbn13 !== ISBN13 ||
                    bookResult.rows[0].book_id !== Book_ID)
            ) {
                await client.query('ROLLBACK');
                return response.status(400).send({
                    message:
                        'Invalid Book_ID / ISBN combination - please ensure the identifiers coordinate to a single rating entry',
                });
            }

            const booksUpdates = [];
            const booksValues: (string | number)[] = [];
            let booksCounter = 1;
            if (Publication_Year !== undefined) {
                booksUpdates.push(`Publication_Year = $${booksCounter++}`);
                booksValues.push(Publication_Year);
            }
            if (Title) {
                booksUpdates.push(`Title = $${booksCounter++}`);
                booksValues.push(Title);
            }
            if (Image_URL) {
                booksUpdates.push(`Image_URL = $${booksCounter++}`);
                booksValues.push(Image_URL);
            }
            if (Image_Small_URL) {
                booksUpdates.push(`Image_Small_URL = $${booksCounter++}`);
                booksValues.push(Image_Small_URL);
            }

            if (booksUpdates.length === 0 && !Authors) {
                await client.query('ROLLBACK');
                return response.status(400).send({
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
                await client.query('ROLLBACK');
                return response.status(400).send({
                    message:
                        'Invalid Publication Year - please ensure the year is a valid positive integer less than or equal to the current year',
                });
            }

            if (Title && (typeof Title !== 'string' || Title.trim() === '')) {
                await client.query('ROLLBACK');
                return response.status(400).send({
                    message:
                        'Invalid Title - please ensure that the title is a valid string',
                });
            }

            if (Authors && typeof Authors !== 'string') {
                await client.query('ROLLBACK');
                return response.status(400).send({
                    message:
                        'Invalid Authors - please ensure that the authors are provided as a comma-separated string',
                });
            }

            if (Image_URL && !/^https?:\/\/\S+\.\S+$/.test(Image_URL)) {
                await client.query('ROLLBACK');
                return response.status(400).send({
                    message:
                        'Invalid Image URL - please ensure that the URL is valid',
                });
            }

            if (
                Image_Small_URL &&
                !/^https?:\/\/\S+\.\S+$/.test(Image_Small_URL)
            ) {
                await client.query('ROLLBACK');
                return response.status(400).send({
                    message:
                        'Invalid Image Small URL - please ensure that the URL is valid',
                });
            }

            if (Publication_Year || Title || Image_Small_URL || Image_URL) {
                const updateQuery = `UPDATE Books SET ${booksUpdates.join(', ')} WHERE ${Book_ID ? `Book_ID = $${booksCounter}` : `ISBN13 = $${booksCounter}`}`;
                booksValues.push(Book_ID || ISBN13);

                await client.query(updateQuery, booksValues);
            }

            let bookId = Book_ID;

            if (!bookId && ISBN13) {
                const result = await client.query(
                    'SELECT Book_ID FROM Books WHERE ISBN13 = $1',
                    [ISBN13]
                );
                if (result.rows.length > 0) {
                    bookId = result.rows[0].book_id;
                } else {
                    await client.query('ROLLBACK');
                    return response.status(400).send({
                        message:
                            'Book entry not found - please ensure the provided ID and/or ISBN is associated with a book entry',
                    });
                }
            }

            if (Authors) {
                await client.query(
                    'DELETE FROM book_author WHERE Book_ID = $1',
                    [bookId]
                );

                const authorNames = Authors.split(',').map((author: string) =>
                    author.trim()
                );

                for (const authorName of authorNames) {
                    const checkAuthorQuery =
                        'SELECT Author_ID FROM Authors WHERE Name = $1';
                    const authorResult = await client.query(checkAuthorQuery, [
                        authorName,
                    ]);

                    let authorId: number;
                    if (authorResult.rows.length > 0) {
                        authorId = authorResult.rows[0].author_id;
                    } else {
                        const insertAuthorQuery =
                            'INSERT INTO Authors (Name) VALUES ($1) RETURNING Author_ID';
                        const insertAuthorResult = await client.query(
                            insertAuthorQuery,
                            [authorName]
                        );
                        authorId = insertAuthorResult.rows[0].author_id;
                    }
                    const insertBookAuthorQuery =
                        'INSERT INTO Book_Author (Book_ID, Author_ID) VALUES ($1, $2)';
                    await client.query(insertBookAuthorQuery, [
                        bookId,
                        authorId,
                    ]);
                }
            }

            await client.query('COMMIT');

            return response
                .status(200)
                .send({ message: 'Book successfully updated' });
        } catch (error) {
            await client.query('ROLLBACK');
            return response
                .status(500)
                .send({ message: 'Server error - contact support' });
        } finally {
            client.release();
        }
    }
);

export { updateBookRouter };
