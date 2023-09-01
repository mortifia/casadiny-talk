'use strict';

//crud to "post"
import express from 'express';
import dotenv from 'dotenv';
import sql from '../sql/sql_client';
import { auth, AuthenticatedRequest } from './auth';

dotenv.config();

const router = express.Router();

/**
 * @sql
 * CREATE TABLE IF NOT EXISTS public.vote
 * (
 *     user_id integer NOT NULL,
 *     post_id character(22) NOT NULL,
 *     positive boolean NOT NULL DEFAULT true,
 *     CONSTRAINT vote_pkey PRIMARY KEY (user_id, post_id)
 * );
 */

type vote = {
    user_id: number,
    post_user_id: number,
    post_created: Date,
    positive: boolean
}

//vote a post by id in url
/**
 * @openapi
 * /vote/{post_id}:
 *  post:
 *   description: vote a post by id in url
 *   security:
 *    - bearerAuth: []
 *   tags:
 *    - vote
 *   parameters:
 *    - in: path
 *      name: post_id
 *      schema:
 *       type: string
 *      required: true
 *      description: user_id of the post
 *   requestBody:
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        vote:
 *         type: integer
 *         description: 1 for positive vote, -1 for negative vote, 0 for no vote
 *       required:
 *        - vote
 *   responses:
 *    200:
 *     description: OK
 *    400:
 *     description: Bad Request
 *    401:
 *     description: Unauthorized
 *    403:
 *     description: Forbidden
 *    404:
 *     description: Not Found
 *    500:
 *     description: Internal Server Error
*/
router.post('/:post_id', auth, async (req: AuthenticatedRequest, res) => {
    const user_id = req.token?.user_id || null;
    if (user_id == null) {
        res.status(401).send('Unauthorized');
        return;
    }
    //post_created = "2023-08-31T04:02:53.603Z"
    const { post_id } = req.params;
    let { vote } = req.body;
    //check if vote is 1, -1 or 0 or null or undefined else return 400
    switch (vote) {
        case 1:
        case -1:
        case 0:
            vote = parseInt(vote);
            break;
        case null:
        case undefined:
            vote = 0;
            break;
        default:
            res.status(400).send('Bad Request');
            return;
    }
    //check if post exists
    let post = await sql<vote[]>`SELECT * FROM post
      WHERE id = ${post_id}`;
    if (post.length == 0) {
        res.status(404).send('Not Found');
        return;
    }
    //get vote if exists to check if is nedeed to update post score
    let old_vote = await sql<vote[]>`SELECT * FROM vote
      WHERE user_id = ${user_id}
        AND post_id = ${post_id}`;
    //calculate difference between old_vote.positive and vote
    let difference = 0;
    if (old_vote.length > 0) {
        //calculate difference between old_vote.positive and vote
        difference = vote - (old_vote[0].positive ? 1 : -1);
    } else {
        difference = vote;
    }
    //if diff != 0 (vote changed)
    if (difference != 0) {
        //if vote is 0
        if (vote == 0) {
            await sql`DELETE FROM vote
              WHERE user_id = ${user_id}
                AND post_id = ${post_id}`;
        }
        //if vote is 1 or -1
        else if (vote != 0) {
            //insert or update vote
            await sql`INSERT INTO vote (user_id, post_id, positive)
                VALUES (${user_id}, ${post_id}, ${vote})
                ON CONFLICT (user_id, post_id)
                DO UPDATE SET positive = ${vote}`;
        }
        //update post score
        await sql`UPDATE post
            SET score = score + ${difference}
            WHERE id = ${post_id}`;
        res.status(200).send('OK');
        return;
    }
    res.status(409).send("Conflict (vote didn't change)");
    return;
});

export default router;