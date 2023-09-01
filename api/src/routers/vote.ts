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
 *     post_user_id integer NOT NULL,
 *     post_created timestamp with time zone NOT NULL,
 *     positive boolean NOT NULL DEFAULT true,
 *     CONSTRAINT vote_pkey PRIMARY KEY (user_id, post_user_id, post_created)
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
 * /vote/{post_user_id}/{post_created}:
 *  post:
 *   description: vote a post by id in url
 *   security:
 *    - bearerAuth: []
 *   tags:
 *    - vote
 *   parameters:
 *    - in: path
 *      name: post_user_id
 *      schema:
 *       type: integer
 *      required: true
 *      description: user_id of the post
 *    - in: path
 *      name: post_created
 *      schema:
 *       type: string
 *      format: date-time
 *      required: true
 *      description: created of the post
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
router.post('/:post_user_id/:post_created', auth, async (req: AuthenticatedRequest, res) => {
    const user_id = req.token?.user_id || null;
    if (user_id == null) {
        res.status(401).send('Unauthorized');
        return;
    }
    //post_created = "2023-08-31T04:02:53.603Z"
    const { post_user_id, post_created: tmp_post_created } = req.params;
    if (isNaN(Date.parse(tmp_post_created))) {
        res.status(400).send('Bad Request');
        return;
    }
    const post_created = new Date(tmp_post_created);

    let { vote } = req.body;
    //check if post exists
    let post = await sql<vote[]>`SELECT * FROM post WHERE user_id = ${post_user_id} LIMIT 1`;
    if (post.length == 0) {
        res.status(404).send('Not Found');
        return;
    }
    console.log("post found");
    //get vote if exists to check if is nedeed to update post score
    let old_vote = await sql<vote[]>`SELECT * FROM vote
      WHERE user_id = ${user_id}
        AND post_user_id = ${post_user_id}
        AND post_created = ${post_created}`;
    //calculate difference between old_vote.positive and vote
    console.log(old_vote.length > 0 ? "vote : " + old_vote[0].positive : "no vote");
    let difference = 0;
    switch (vote) {
        case 1:
            vote = 1;
            break;
        case -1:
            vote = -1;
            break;
        case 0:
            vote = 0;
            break;
        default:
            res.status(400).send('Bad Request');
            return;
    }
    if (old_vote.length > 0) {
        //calculate difference between old_vote.positive and vote
        difference = vote - (old_vote[0].positive ? 1 : -1);
    } else {
        difference = vote;
    }
    console.log(difference);
    //if diff != 0 (vote changed)
    if (difference != 0) {
        //if vote is 0
        if (vote == 0) {
            await sql`DELETE FROM vote
              WHERE user_id = ${user_id}
                AND post_user_id = ${post_user_id}
                AND post_created = ${post_created}::timestamp with time zone`;
        }
        //if vote is 1 or -1
        else if (vote != 0) {
            //insert or update vote
            await sql`INSERT INTO vote (user_id, post_user_id, post_created, positive)
            VALUES (${user_id}, ${post_user_id}, ${post_created}::timestamp with time zone, ${vote})
            ON CONFLICT (user_id, post_user_id, post_created)
            DO UPDATE SET positive = ${vote}`;
        }
        //update post score
        await sql`UPDATE post SET score = score + ${difference} WHERE user_id = ${post_user_id} AND created = ${post_created}`;
    }
    res.status(200).send('OK');
});

export default router;