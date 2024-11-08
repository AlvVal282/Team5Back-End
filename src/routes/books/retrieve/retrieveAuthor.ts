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

    if (!author) {
        return response.status(400).send({
            message: 'Missing required parameter: author',
        });
    }
    
    if (!validationFunctions.isStringProvided(author as string)) {
        return response.status(400).send({
            message: 'Invalid parameter: author must be a non-empty string',
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
 * @apiDescription Retrieve a list of books filtered by an author's name. This endpoint supports partial matching, allowing flexible searches by either a full or partial author name.
 * 
 * @apiQuery (Query Parameters) {String} author The partial or full name of the author to search for. **Required.**
 * @apiQuery (Query Parameters) {Number} [limit=10] The maximum number of book entries to return in the response. **Optional; defaults to 10.**
 * @apiQuery (Query Parameters) {Number} [offset=0] The number of book entries to skip from the beginning of the result set. **Optional; defaults to 0.**
 * 
 * @apiSuccess {Object[]} books List of books that match the search criteria. Each book object contains the following:
 * @apiSuccess {Number} books.isbn13 The ISBN-13 identifier of the book.
 * @apiSuccess {String} books.author The name(s) of the book's author(s), separated by commas if multiple.
 * @apiSuccess {Number} books.publication The publication year of the book.
 * @apiSuccess {String} books.title The title of the book.
 * @apiSuccess {Object} books.ratings Rating details for the book.
 * @apiSuccess {Number} books.ratings.average The average rating of the book.
 * @apiSuccess {Number} books.ratings.count The total number of ratings received.
 * @apiSuccess {Number} books.ratings.rating_1 The number of 1-star ratings.
 * @apiSuccess {Number} books.ratings.rating_2 The number of 2-star ratings.
 * @apiSuccess {Number} books.ratings.rating_3 The number of 3-star ratings.
 * @apiSuccess {Number} books.ratings.rating_4 The number of 4-star ratings.
 * @apiSuccess {Number} books.ratings.rating_5 The number of 5-star ratings.
 * @apiSuccess {Object} books.icons Book cover image URLs.
 * @apiSuccess {String} books.icons.large URL for the large cover image of the book.
 * @apiSuccess {String} books.icons.small URL for the small cover image of the book.
 * 
 * @apiSuccess {Object} pagination Pagination metadata for the response.
 * @apiSuccess {Number} pagination.totalRecords Total number of books matching the search criteria.
 * @apiSuccess {Number} pagination.limit The limit parameter used in the request or defaulted to 10.
 * @apiSuccess {Number} pagination.offset The offset parameter used in the request or defaulted to 0.
 * @apiSuccess {Number} [pagination.nextPage] Offset value to retrieve the next set of entries, if available. If no more pages are available, this will be `null`.
 * 
 * @apiError (400 Bad Request) {String} message "Missing required parameter: author" - This error is returned if the `author` query parameter is not provided.
 * @apiError (400 Bad Request) {String} message "Invalid parameter: author must be a non-empty string" - This error is returned if the `author` parameter is not a valid, non-empty string.
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
            console.error('DB Query error on retrieve by author', error);
            response.status(500).send({
                message: 'Server error - contact support',
            });
        }
    }
);

export { retrieveAuthorRouter };

