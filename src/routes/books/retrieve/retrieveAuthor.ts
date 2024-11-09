import express, { NextFunction, Request, Response, Router } from 'express';
import { pool, validationFunctions } from '../../../core/utilities';

const retrieveAuthorRouter: Router = express.Router();

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
 * Middleware to validate the author parameter.
 */
function mwValidAuthorParam(request: Request, response: Response, next: NextFunction) {
    const { author } = request.query;
  
    if (!validationFunctions.isStringProvided(author as string)) {
        response.status(400).send({
            message: 'Invalid or missing author - please ensure that param is entered and is valid'
        });
    }

    next();
}

/**
 * Middleware to validate limit and offset parameters.
 */
function mwValidPaginationParams(request: Request, response: Response, next: NextFunction) {
    let limit = Number(request.query.limit);
    let offset = Number(request.query.offset);

    if (isNaN(limit) || limit <= 0) {
        limit = 10; // Default limit
    }

    if (isNaN(offset) || offset < 0) {
        offset = 0; // Default offset
    }

    request.query.limit = limit.toString();
    request.query.offset = offset.toString();

    next();
}

/**
 * @api {get} /books/author Retrieve Books by Author
 * @apiName GetBooksByAuthor
 * @apiGroup Books
 * 
 * @apiDescription Retrieve a list of books filtered by author name. Allows partial matching on the author's name for flexibility.
 * 
 * @apiQuery {String} author Partial or full name of the author to search for **Required**
 * @apiQuery {number} [limit=10] limit The number of entry objects to return. **Optional.**
 * @apiQuery {number} [offset=10] offset The number to offset the lookup of entry objects to return. **Optional.**
 * 
 * @apiSuccess {Object[]} books List of books that match the provided author name.
 * @apiSuccess (Success 200) {Number} books.isbn13 Unique ISBN-13 identifier of the book.
 * @apiSuccess (Success 200) {String} books.author Comma-separated list of authors of the book.
 * @apiSuccess (Success 200) {Number} books.publication Publication year of the book.
 * @apiSuccess (Success 200) {String} books.title Title of the book.
 * @apiSuccess (Success 200) {Object} books.ratings Rating details of the book.
 * @apiSuccess (Success 200) {Number} books.ratings.average Average rating score.
 * @apiSuccess (Success 200) {Number} books.ratings.count Total number of ratings.
 * @apiSuccess (Success 200) {Number} books.ratings.rating_1 Count of 1-star ratings.
 * @apiSuccess (Success 200) {Number} books.ratings.rating_2 Count of 2-star ratings.
 * @apiSuccess (Success 200) {Number} books.ratings.rating_3 Count of 3-star ratings.
 * @apiSuccess (Success 200) {Number} books.ratings.rating_4 Count of 4-star ratings.
 * @apiSuccess (Success 200) {Number} books.ratings.rating_5 Count of 5-star ratings.
 * @apiSuccess (Success 200) {Object} books.icons URLs to book cover images.
 * @apiSuccess (Success 200) {String} books.icons.large URL to the large version of the book cover image.
 * @apiSuccess (Success 200) {String} books.icons.small URL to the small version of the book cover image.
 * 
 * @apiSuccess {Object} pagination Pagination metadata for the response
 * @apiSuccess {number} pagination.totalRecords Total number of matching books
 * @apiSuccess {number} pagination.limit Number of entries returned per page
 * @apiSuccess {number} pagination.offset Offset used for the current query
 * @apiSuccess {number} pagination.nextPage Offset value to retrieve the next set of entries
 * 
 * @apiError (400: Invalid Author) {String} message "Invalid or missing author - please ensure that param is entered and is valid"
 * @apiError (404: Author Not Found) {String} message "Author Not Found"
 */
retrieveAuthorRouter.get(
    '/retrieveAuthor',
    mwValidAuthorParam,
    mwValidPaginationParams,
    async (request: Request, response: Response) => {
        const { author } = request.query;
        const limit = Number(request.query.limit);
        const offset = Number(request.query.offset);

        try {
            // Count total books matching the author
            const countQuery = `
                SELECT COUNT(DISTINCT Books.Book_ID) AS "totalRecords"
                FROM Books
                JOIN Book_Author ON Books.Book_ID = Book_Author.Book_ID
                JOIN Authors ON Authors.Author_ID = Book_Author.Author_ID
                WHERE Authors.Name ILIKE '%' || $1 || '%'
            `;
            const countResult = await pool.query(countQuery, [author]);
            const totalRecords = parseInt(countResult.rows[0].totalRecords, 10);

            // If no records found, send a 404 response
            if (totalRecords === 0) {
                return response.status(404).send({
                    message: 'Author Not Found',
                });
            }

            // Fetch paginated books matching the author
            const theQuery = `
                SELECT 
                    Books.isbn13,
                    Books.publication_year,
                    Books.title,
                    Books.rating_avg,
                    Books.rating_count,
                    COALESCE(Book_Ratings.rating_1_star, 0) AS rating_1_star,
                    COALESCE(Book_Ratings.rating_2_star, 0) AS rating_2_star,
                    COALESCE(Book_Ratings.rating_3_star, 0) AS rating_3_star,
                    COALESCE(Book_Ratings.rating_4_star, 0) AS rating_4_star,
                    COALESCE(Book_Ratings.rating_5_star, 0) AS rating_5_star,
                    Books.image_url,
                    Books.image_small_url,
                    STRING_AGG(Authors.Name, ', ') AS authors
                FROM Books
                JOIN Book_Author ON Books.Book_ID = Book_Author.Book_ID
                JOIN Authors ON Authors.Author_ID = Book_Author.Author_ID
                LEFT JOIN Book_Ratings ON Books.Book_ID = Book_Ratings.Book_ID
                WHERE Authors.Name ILIKE '%' || $1 || '%'
                GROUP BY 
                    Books.isbn13, 
                    Books.publication_year, 
                    Books.title, 
                    Books.rating_avg, 
                    Books.rating_count, 
                    Books.image_url, 
                    Books.image_small_url,
                    Book_Ratings.rating_1_star,
                    Book_Ratings.rating_2_star,
                    Book_Ratings.rating_3_star,
                    Book_Ratings.rating_4_star,
                    Book_Ratings.rating_5_star
                LIMIT $2 OFFSET $3
            `;

            const values = [author, limit, offset];
            const { rows } = await pool.query(theQuery, values);

            response.status(200).json({
                books: rows.map(format),
                pagination: {
                    totalRecords,
                    limit,
                    offset,
                    nextPage: offset + limit < totalRecords ? offset + limit : null,
                },
            });
        } catch (error) {
            //console.error('DB Query error on retrieve by author', error);
            response.status(500).send({
                message: 'DB error while trying to retrieve a book by Author',
            });
        }
    }
);

export { retrieveAuthorRouter };

