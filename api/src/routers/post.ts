'use strict';

//crud to "post"
import express from 'express';
import dotenv from 'dotenv';
import sql from '../sql/sql_client';
import { auth, AuthenticatedRequest } from './auth';
import { type } from 'os';

dotenv.config();

const router = express.Router();

/**
 * @sql
 * CREATE TABLE IF NOT EXISTS public.post
 * (
 *     user_id integer NOT NULL,
 *     created timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
 *     text character varying(256) COLLATE pg_catalog."default",
 *     score bigint NOT NULL DEFAULT 0,
 *     post_parent_id integer,
 *     post_parent_created timestamp with time zone,
 *     CONSTRAINT post_pkey PRIMARY KEY (user_id, created)
 * );
 */

/**
 * @sql
 * CREATE TABLE IF NOT EXISTS public.vote
 * (
 *     user_id integer NOT NULL,
 *     post_user_id integer NOT NULL,
 *     post_created timestamp with time zone NOT NULL,
 *     positive boolean NOT NULL DEFAULT true,
 *     CONSTRAINT vote_pkey PRIMARY KEY (user_id, post_user_id, post_created)
 * );
 */

/**
 * @sql
 * CREATE TABLE IF NOT EXISTS public.following
 * (
 *     user_id integer NOT NULL,
 *     "user_id_following " integer NOT NULL,
 *     CONSTRAINT "following _pkey" PRIMARY KEY (user_id, "user_id_following ")
 * );
*/

type post = {
    user_id: number,
    created: Date,
    text: string,
    score: number,
    post_parent_id: number,
    post_parent_created: Date
}


// get all posts with pagination and choice to wiew only post by followed users
// default sort (popular) by newest 48h and score
// page and sort in url query
// /post?page=0&sort=popular
/**
 * @openapi
 * /post:
 *  get:
 *   description: get all posts with pagination and choice to wiew only post by followed users
 *   tags:
 *    - post
 */
router.get('/', auth, async (req, res) => {
    const page = parseInt(req.query.page as string || '0');
    // const { user_id } = req.body;
    const limit = 10;
    const offset = page * limit;
    // sort by newest 48h and score (popular)
    // order by score divided by hours since creation
    let posts = await sql<post[]>`
        SELECT p.* FROM post p
            WHERE p.created > NOW() - INTERVAL '48 hours'
            ORDER BY p.score / EXTRACT(EPOCH FROM NOW() - p.created) DESC
            LIMIT ${limit} OFFSET ${offset}
    `;
    res.json(posts);
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
        res.status(401).json({ error: 'you need to be log' });
        return;
    }
    if (!text) {
        res.status(400).json({ error: 'text is required' });
        return;
    }
    const post = await sql<post[]>`INSERT INTO post (user_id, text)
        VALUES (${user_id}, ${text})
        RETURNING *`;
    if (post.length === 0) {
        res.status(500).json({ error: 'internal server error' });
        return;
    }
    res.status(201).json(post);
});

export default router;
