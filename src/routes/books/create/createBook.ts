/* eslint-disable @typescript-eslint/naming-convention */
import express, { Request, Response, Router } from 'express';
import { pool } from '../../../core/utilities';

const createBookRouter: Router = express.Router();

/**
 * @apiDefine JWT
 * @apiHeader {String} Authorization The string "Bearer " + a valid JSON Web Token (JWT).
 */

/**
 * @api {post} /addBook Create a book entry
 *
 * @apiDescription Request to create a book entry.
 *
 * @apiName AddBook
 * @apiGroup create
 * 
 * @apiUse JWT
 *
 * @apiBody {BIGINT} ISBN13 (Required) The ISBN for the book.
 * @apiBody {TEXT} Title (Required) The title of the book.
 * @apiBody {TEXT} Authors (Optional) A comma-separated list of authors.
 * @apiBody {FLOAT} Rating_Avg (Optional) The average rating for the book.
 * @apiBody {INT} Rating_Count (Optional) The count of ratings for the book.
 * @apiBody {INT} One_Star_Count (Optional) Count of 1-star ratings.
 * @apiBody {INT} Two_Star_Count (Optional) Count of 2-star ratings.
 * @apiBody {INT} Three_Star_Count (Optional) Count of 3-star ratings.
 * @apiBody {INT} Four_Star_Count (Optional) Count of 4-star ratings.
 * @apiBody {INT} Five_Star_Count (Optional) Count of 5-star ratings.
 * @apiBody {TEXT} Image_URL (Optional) URL for the book image.
 * @apiBody {TEXT} Image_Small_URL (Optional) URL for the small book image.
 * @apiBody {INT} Publication_Year (Optional) Year of publication.
 *
 * @apiSuccess (201) {String} message "Book successfully created"
 *
 * @apiError (400: Missing/Invalid ISBN) {String} message "Missing or invalid ISBN13 - please ensure that the ISBN is entered, unique, and a 13 digit positive integer"
 * @apiError (400: Missing/Invalid Title) {String} message "Missing or invalid Title - please ensure that the title is entered and a valid string"
 * @apiError (400: Invalid Authors) {String} message "Invalid Authors - please ensure that the authors are provided as a comma-separated string"
 * @apiError (400: Invalid Rating_Avg) {String} message "Invalid Rating Average - please ensure that Rating_Avg is a valid number between 1 and 5"
 * @apiError (400: Invalid Rating_Avg) {String} message "Invalid Rating Average - please ensure that Rating_Avg matches the average of the star counts"
 * @apiError (400: Invalid Rating Count) {String} message "Invalid Rating count - please ensure that the rating count is a non-negative integer equal to the sum of all star counts"
 * @apiError (400: Invalid One_Star_Count) {String} message "Invalid 1 star count - please ensure that the 1 star count is a non-negative integer"
 * @apiError (400: Invalid Two_Star_Count) {String} message "Invalid 2 star count - please ensure that the 2 star count is a non-negative integer"
 * @apiError (400: Invalid Three_Star_Count) {String} message "Invalid 3 star count - please ensure that the 3 star count is a non-negative integer"
 * @apiError (400: Invalid Four_Star_Count) {String} message "Invalid 4 star count - please ensure that the 4 star count is a non-negative integer"
 * @apiError (400: Invalid Five_Star_Count) {String} message "Invalid 5 star count - please ensure that the 5 star count is a non-negative integer"
 * @apiError (400: Invalid Image URL) {String} message "Invalid Image URL - please ensure that the URL is valid"
 * @apiError (400: Invalid Image Small URL) {String} message "Invalid Image Small URL - please ensure that the URL is valid"
 * @apiError (400: Invalid Publication Year) {String} message "Invalid Publication Year - please ensure the year is a valid positive integer less than or equal to the current year"
 * @apiError (400: Non-Unique ISBN) {String} message "ISBN already exists in the database - please use an ISBN not already in the system"
 */

createBookRouter.post(
    '/addBook',
    async (request: Request, response: Response) => {
        const {
            ISBN13,
            Title,
            Authors,
            Rating_Avg,
            Rating_Count,
            One_Star_Count,
            Two_Star_Count,
            Three_Star_Count,
            Four_Star_Count,
            Five_Star_Count,
            Image_URL,
            Image_Small_URL,
            Publication_Year,
        } = request.body;

        if (!ISBN13 || !/^\d{13}$/.test(String(ISBN13))) {
            return response.status(400).send({
                message:
                    'Missing or invalid ISBN13 - please ensure that the ISBN is entered, unique, and a 13 digit positive integer',
            });
        }

        if (!Title || typeof Title !== 'string' || Title.trim() === '') {
            return response.status(400).send({
                message:
                    'Missing or invalid Title - please ensure that the title is entered and a valid string',
            });
        }

        if (Authors && typeof Authors !== 'string') {
            return response.status(400).send({
                message:
                    'Invalid Authors - please ensure that the authors are provided as a comma-separated string',
            });
        }

        let starCounts = [
            Rating_Count,
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
                if (i > 0) {
                    return response.status(400).send({
                        message: `Invalid ${i} star count - please ensure that the ${i} star count is a non-negative integer`,
                    });
                } else {
                    return response.status(400).send({
                        message: `Invalid Rating count - please ensure that the rating count is a non-negative integer equal to the sum of all star counts`,
                    });
                }
            }
        }

        if (Rating_Avg !== undefined) {
            if (
                typeof Rating_Avg !== 'number' ||
                Rating_Avg < 1 ||
                Rating_Avg > 5
            ) {
                return response.status(400).send({
                    message:
                        'Invalid Rating Average - please ensure that Rating_Avg is a valid number between 1 and 5',
                });
            } else {
                const calculatedAvg =
                    (One_Star_Count * 1 +
                        Two_Star_Count * 2 +
                        Three_Star_Count * 3 +
                        Four_Star_Count * 4 +
                        Five_Star_Count * 5) /
                    Rating_Count;

                if (Math.abs(Rating_Avg - calculatedAvg) > 0.01) {
                    return response.status(400).send({
                        message:
                            'Invalid Rating Average - please ensure that Rating_Avg matches the average of the star counts',
                    });
                }
            }
        }

        starCounts = [...starCounts.slice(1)];
        if (Rating_Count !== undefined) {
            const calculatedCount = Object.values(starCounts).reduce(
                (sum, count) => sum + (count || 0),
                0
            );
            if (Rating_Count !== calculatedCount) {
                return response.status(400).send({
                    message:
                        'Invalid Rating count - please ensure that the rating count is a non-negative integer equal to the sum of all star counts',
                });
            }
        }

        if (
            Image_URL &&
            !/^(https?:\/\/)[\w-]+(\.[\w-]+)+[/#?]?.*$/.test(Image_URL)
        ) {
            return response.status(400).send({
                message:
                    'Invalid Image URL - please ensure that the URL is valid',
            });
        }

        if (
            Image_Small_URL &&
            !/^(https?:\/\/)[\w-]+(\.[\w-]+)+[/#?]?.*$/.test(Image_Small_URL)
        ) {
            return response.status(400).send({
                message:
                    'Invalid Image Small URL - please ensure that the URL is valid',
            });
        }

        if (
            Publication_Year !== undefined &&
            (typeof Publication_Year !== 'number' ||
                Publication_Year < 1 ||
                Publication_Year > new Date().getFullYear())
        ) {
            return response.status(400).send({
                message:
                    'Invalid Publication Year - please ensure the year is a valid positive integer less than or equal to the current year',
            });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const checkISBNQuery = 'SELECT * FROM Books WHERE ISBN13 = $1';
            const isbnResult = await client.query(checkISBNQuery, [ISBN13]);

            if (isbnResult.rows.length > 0) {
                await client.query('ROLLBACK');
                return response.status(400).send({
                    message:
                        'ISBN already exists in the database - please use an ISBN not already in the system',
                });
            }

            const insertBookQuery =
                'INSERT INTO Books (ISBN13, Title, Publication_Year, Rating_Avg, Rating_Count, Image_URL, Image_Small_URL) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING Book_ID';
            const bookValues = [
                ISBN13,
                Title,
                Publication_Year,
                Rating_Avg,
                Rating_Count,
                Image_URL,
                Image_Small_URL,
            ];
            const bookResult = await client.query(insertBookQuery, bookValues);

            const bookId = bookResult.rows[0].book_id;

            if (Authors) {
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

            const insertRatingsQuery = `
            INSERT INTO Book_Ratings (
                Book_ID,
                Rating_1_Star,
                Rating_2_Star,
                Rating_3_Star,
                Rating_4_Star,
                Rating_5_Star
            ) VALUES ($1, $2, $3, $4, $5, $6)`;
            const ratingValues = [
                bookId,
                One_Star_Count,
                Two_Star_Count,
                Three_Star_Count,
                Four_Star_Count,
                Five_Star_Count,
            ];

            await client.query(insertRatingsQuery, ratingValues);

            await client.query('COMMIT');

            return response.status(201).send({
                message: 'Book successfully created',
            });
        } catch (error) {
            await client.query('ROLLBACK');
            return response.status(500).send({
                message: 'Server error - contact support',
            });
        } finally {
            client.release();
        }
    }
);

export { createBookRouter };
