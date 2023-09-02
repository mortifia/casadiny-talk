'use strict';

//crud to "post"
import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import sql from '../sql/sql_client';
import { auth, AuthenticatedRequest } from './auth';

dotenv.config();

const router = express.Router();

/**
 * @sql
 * CREATE TABLE IF NOT EXISTS public.post
 * (
 *     id character(22) NOT NULL,
 *     user_id integer NOT NULL,
 *     created timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
 *     text character varying(256) COLLATE pg_catalog."default" NOT NULL,
 *     score bigint NOT NULL DEFAULT 0,
 *     post_parent_id character(22),
 *     PRIMARY KEY (id)
 * );
 */

type post = {
    id: string, //uuid as base64url (22characters)
    user_id: number,
    created: Date,
    text: string,
    score: number,
    post_parent_id: string
}

type postWithUsername = post & {
    username: string
}

type postWithUsernameAndVote = postWithUsername & {
    positive: boolean
}


// get all posts with pagination and choice to wiew only post by followed users
// default sort (popular) by newest 48h and score
// page and sort in url query
// /post?page=0&sort=popular
/**
 * @openapi
 * /post:
 *  get:
 *   description: get all posts with pagination
 *   security:
 *    - bearerAuth: []
 *   tags:
 *    - post
 *   responses:
 *    200:
 *     description: posts
 */
router.get('/', auth, async (req, res) => {
    const page = parseInt(req.query.page as string || '0');
    const { user_id } = req.body || null;
    const limit = 10;
    const offset = page * limit;
    // sort by newest 48h and score (popular)
    // order by score divided by hours since creation
    // add username and the vote of the user
    // id of the posts as base64url
    if (user_id == null) {
        // for posterity, uuid to base64url
        // select TRANSLATE(ENCODE(DECODE(REPLACE('842952d3-a012-4c2e-b1ef-4c52787b8c98'::text,'-',''),'hex'),'base64'),'/+=','_-');
        const posts = await sql<postWithUsername[]>`
            SELECT  p.*, u.username FROM post p
            JOIN "user" u ON p.user_id = u.id
            ORDER BY (p.score / EXTRACT(EPOCH FROM (NOW() - p.created)) / 3600) DESC
            LIMIT ${limit} OFFSET ${offset}`;
        res.json(posts);
    }
    else {
        const posts = await sql<postWithUsernameAndVote[]>`
            SELECT p.*, u.username, v.positive FROM post p
            JOIN "user" u ON p.user_id = u.id
            LEFT JOIN vote v ON p.id = v.post_id AND v.user_id = ${user_id}
            ORDER BY (p.score / EXTRACT(EPOCH FROM (NOW() - p.created)) / 3600) DESC
            LIMIT ${limit} OFFSET ${offset}`;
        res.json(posts);
    }
    return;
});

// post a new post
/**
 * @openapi
 * /post:
 *  post:
 *   description: post a new post
 *   security:
 *    - bearerAuth: []
 *   tags:
 *    - post
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        text:
 *         type: string
 *         example: "this is a post"
 *   responses:
 *    201:
 *     description: post created
 *    400:
 *     description: bad request
 *    401:
 *     description: unauthorized
 *    500:
 *     description: internal server error
*/
router.post('/', auth, async (req: AuthenticatedRequest, res) => {
    const user_id = req.token?.user_id || null;
    const { text } = req.body;
    if (!user_id) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    if (!text) {
        res.status(400).json({ error: 'text is required' });
        return;
    }
    // uuid
    const postId = Buffer.from(crypto.randomUUID().replaceAll("-", ""), 'hex').toString('base64url');

    //return id of the new post as base64url
    const post = await sql<post[]>`INSERT INTO post (id, user_id, text)
        VALUES (${postId}, ${user_id}, ${text})
        RETURNING id, user_id, created, text, score, post_parent_id`;
    if (post.length === 0) {
        res.status(500).json({ error: 'internal server error' });
        return;
    }
    res.status(201).json(post);
});

//delete a post
/**
 * @openapi
 * /post/{id}:
 *  delete:
 *   description: delete a post
 *   security:
 *    - bearerAuth: []
 *   tags:
 *    - post
 *   parameters:
 *    - name: id
 *      in: path
 *      required: true
 *      schema:
 *       type: string
 *      example: "hClS0qASTC6x7xLHh4uYmQ"
 *   responses:
 *    200:
 *     description: post deleted
 *    400:
 *     description: bad request
 *    401:
 *     description: unauthorized
 *    500:
 *     description: internal server error
*/
router.delete('/:id', auth, async (req: AuthenticatedRequest, res) => {
    const user_id = req.token?.user_id || null;
    const { id } = req.params;
    if (user_id == null) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    if (!id) {
        res.status(400).json({ error: 'id is required' });
        return;
    }
    // check if the user is the owner of the post
    const post = await sql<post[]>`SELECT * FROM post
        WHERE id = ${id}
        AND user_id = ${user_id}
        LIMIT 1`;
    if (post.length === 0) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    // delete the post
    const deleted = await sql<post[]>`DELETE FROM post
        WHERE id = ${id}`;
    if (deleted.length === 0) {
        res.status(500).json({ error: 'internal server error' });
        return;
    }
    res.status(200).json({ message: 'post deleted' });
});

// get a post by id
/**
 * @openapi
 * /post/{id}:
 *  get:
 *   description: get a post by id
 *   security:
 *    - bearerAuth: []
 *   tags:
 *    - post
 *   parameters:
 *    - name: id
 *      in: path
 *      required: true
 *      schema:
 *       type: string
 *      example: "hClS0qASTC6x7xLHh4uYmQ"
 *   responses:
 *    200:
 *     description: post
 *    400:
 *     description: bad request
 *    401:
 *     description: unauthorized
 *    404:
 *     description: post not found
 *    500:
 *     description: internal server error
*/
router.get('/:id', auth, async (req: AuthenticatedRequest, res) => {
    const user_id = req.token?.user_id || null;
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ error: 'id is required' });
        return;
    }
    let post: postWithUsernameAndVote[] | postWithUsername[] = [];
    if (user_id == null) {
        post = await sql<postWithUsername[]>` SELECT p.*, u.username FROM post p
            JOIN "user" u ON p.user_id = u.id
            WHERE p.id = ${id}
            LIMIT 1`;
    } else {
        post = await sql<postWithUsernameAndVote[]>` SELECT p.*, u.username, v.positive FROM post p
            JOIN "user" u ON p.user_id = u.id
            LEFT JOIN vote v ON p.id = v.post_id AND v.user_id = ${user_id}
            WHERE p.id = ${id}
            LIMIT 1`;
    }
    if (post.length === 0) {
        res.status(404).json({ error: 'post not found' });
        return;
    }
    res.status(200).json(post[0]);
    return;
});

// get replies of a post
/**
 * @openapi
 * /post/{id}/replies/{page}:
 *  get:
 *   description: get replies of a post
 *   security:
 *    - bearerAuth: []
 *   tags:
 *    - post
 *   parameters:
 *    - name: id
 *      in: path
 *      required: true
 *      schema:
 *       type: string
 *      example: "hClS0qASTC6x7xLHh4uYmQ"
 *    - name: page
 *      in: path
 *      required: true
 *      schema:
 *       type: integer
 *      example: 0
 *   responses:
 *    200:
 *     description: replies
 *    400:
 *     description: bad request
 *    401:
 *     description: unauthorized
 *    404:
 *     description: post not found
 *    500:
 *     description: internal server error
*/
router.get('/:id/replies', auth, async (req: AuthenticatedRequest, res) => {
    const user_id = req.token?.user_id || null;
    const { id, page } = req.params;
    const limit = 25;
    if (!id) {
        res.status(400).json({ error: 'id is required' });
        return;
    }
    let post: postWithUsernameAndVote[] | postWithUsername[] = [];
    if (user_id == null) {
        post = await sql<postWithUsername[]>` SELECT p.*, u.username FROM post p
            JOIN "user" u ON p.user_id = u.id
            WHERE p.post_parent_id = ${id}
            ORDER BY p.created ASC
            LIMIT ${limit} OFFSET ${Number(page || 0) * limit}`;
    } else {
        post = await sql<postWithUsernameAndVote[]>` SELECT p.*, u.username, v.positive FROM post p
            JOIN "user" u ON p.user_id = u.id
            LEFT JOIN vote v ON p.id = v.post_id AND v.user_id = ${user_id}
            WHERE p.post_parent_id = ${id}
            ORDER BY p.created ASC
            LIMIT ${limit} OFFSET ${Number(page || 0) * limit}`;
    }
    return res.status(200).json(post);
});






export default router;
