mimport express, { Request, Response, Router, NextFunction } from 'express';
import { pool, validationFunctions } from '../../../core/utilities';

const isISBNProvided = validationFunctions.isValidISBN13;

const retrieveISBNRouter: Router = express.Router();

interface IRatings {
    average: number;
    count: number;
    rating_1: number;
    rating_2: number;
    rating_3: number;
    rating_4: number;
    rating_5: number;
}

interface IUrlIcon {
    large: string;
    small: string;
}

interface IBook {
    isbn13: number;
    author: string;
    publication: number;
    title: string;
    ratings: IRatings;
    icons: IUrlIcon;
}

const format = (resultRow): IBook => ({
    isbn13: resultRow.isbn13,
    author: resultRow.authors,
    publication: resultRow.publication_year,
    title: resultRow.title,
    ratings: {
        average: resultRow.rating_avg,
        count: resultRow.rating_count,
        rating_1: resultRow.rating_1_star,
        rating_2: resultRow.rating_2_star,
        rating_3: resultRow.rating_3_star,
        rating_4: resultRow.rating_4_star,
        rating_5: resultRow.rating_5_star,
    },
    icons: {
        large: resultRow.image_url,
        small: resultRow.image_small_url,
    },
});

/**
 * @api {get} /retrieveISBN Retrieve a book by ISBN
 * @apiName GetBookByISBN
 * @apiGroup Books
 *
 * @apiDescription Retrieves details for books with the specified ISBN. Supports optional pagination.
 *
 * @apiQuery (Query Parameters){Number} ISBN The ISBN number to look up (13 digits).
 * @apiQuery {Number} [limit=10] The maximum number of books to return per page. **Optional.** 
 * @apiQuery {Number} [offset=0] The number of books to skip from the start of the result set. **Optional.** 
 *
 * @apiSuccess {Object[]} books List of books matching the specified ISBN.
 * @apiSuccess {number} books.isbn13 Book's ISBN number.
 * @apiSuccess {string} books.author Book author(s).
 * @apiSuccess {number} books.publication Publication year.
 * @apiSuccess {string} books.title Book title.
 * @apiSuccess {Object} books.ratings Ratings structure.
 * @apiSuccess {number} books.ratings.average Average rating.
 * @apiSuccess {number} books.ratings.count Rating count.
 * @apiSuccess {number} books.ratings.rating_1 Rating count for 1 star.
 * @apiSuccess {number} books.ratings.rating_2 Rating count for 2 stars.
 * @apiSuccess {number} books.ratings.rating_3 Rating count for 3 stars.
 * @apiSuccess {number} books.ratings.rating_4 Rating count for 4 stars.
 * @apiSuccess {number} books.ratings.rating_5 Rating count for 5 stars.
 * @apiSuccess {Object} books.icons Icon structure.
 * @apiSuccess {string} books.icons.large URL for large image.
 * @apiSuccess {string} books.icons.small URL for small image.
 *
 * @apiSuccess {Object} pagination Pagination metadata for the response.
 * @apiSuccess {Number} pagination.totalRecords Total number of books matching the ISBN.
 * @apiSuccess {Number} pagination.limit Number of entries returned per page.
 * @apiSuccess {Number} pagination.offset Offset used for the current query.
 * @apiSuccess {Number|null} pagination.nextPage Offset value to retrieve the next set of entries, or null if no further pages exist.
 * 
 * @apiError (400: Invalid ISBN) {string} message "Invalid or missing ISBN - please ensure the ISBN parameter is provided and valid (13 digits)."
 * @apiError (404: ISBN Not Found) {string} message "ISBN Not Found."
 * @apiError (500: Server Error) {string} message "Server error - unable to retrieve book by ISBN."
 */
retrieveISBNRouter.get(
    '/retrieveISBN',
    (request: Request, response: Response, next: NextFunction) => {
        const isbn = request.query.ISBN as string;
        if (isISBNProvided(isbn)) {
            next();
        } else {
            response.status(400).send({
                message: 'Invalid or missing ISBN - please ensure the ISBN parameter is provided and valid.',
            });
        }
    },
    async (request: Request, response: Response) => {
        const isbn = request.query.ISBN as string;
        const limit = Number(request.query.limit) > 0 ? Number(request.query.limit) : 10;
        const offset = Number(request.query.offset) >= 0 ? Number(request.query.offset) : 0;

        try {
            const countQuery = `
                SELECT COUNT(*) AS "totalRecords"
                FROM Books
                WHERE ISBN13 = $1
            `;
            const countResult = await pool.query(countQuery, [isbn]);
            const totalRecords = parseInt(countResult.rows[0].totalRecords, 10);

            if (totalRecords === 0) {
                response.status(404).send({
                    message: 'ISBN Not Found.',
                });
            } else {
                const theQuery = `
                    SELECT 
                        Books.isbn13,
                        Books.publication_year,
                        Books.title,
                        Books.rating_avg,
                        Books.rating_count,
                        COALESCE(SUM(Book_Ratings.rating_1_star), 0) AS rating_1_star,
                        COALESCE(SUM(Book_Ratings.rating_2_star), 0) AS rating_2_star,
                        COALESCE(SUM(Book_Ratings.rating_3_star), 0) AS rating_3_star,
                        COALESCE(SUM(Book_Ratings.rating_4_star), 0) AS rating_4_star,
                        COALESCE(SUM(Book_Ratings.rating_5_star), 0) AS rating_5_star,
                        Books.image_url,
                        Books.image_small_url,
                        STRING_AGG(Authors.Name, ', ') AS authors
                    FROM Books
                    LEFT JOIN Book_Ratings ON Books.Book_ID = Book_Ratings.Book_ID
                    JOIN Book_Author ON Books.Book_ID = Book_Author.Book_ID
                    JOIN Authors ON Authors.Author_ID = Book_Author.Author_ID
                    WHERE Books.ISBN13 = $1
                    GROUP BY 
                        Books.isbn13, 
                        Books.publication_year, 
                        Books.title, 
                        Books.rating_avg, 
                        Books.rating_count, 
                        Books.image_url, 
                        Books.image_small_url
                    LIMIT $2 OFFSET $3
                `;
                const values = [isbn, limit, offset];
                const { rows } = await pool.query(theQuery, values);

                response.status(200).send({
                    books: rows.map(format),
                    pagination: {
                        totalRecords,
                        limit,
                        offset,
                        nextPage: offset + limit < totalRecords ? offset + limit : null,
                    },
                });
            }
        } catch (error) {
            console.error('Database error:', error);
            response.status(500).send({
                message: 'Server error - unable to retrieve book by ISBN.',
            });
        }
    }
);

export { retrieveISBNRouter };

