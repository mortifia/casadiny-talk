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
 *   description: get all posts with pagination and choice to wiew only post by followed users
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

export default router;
