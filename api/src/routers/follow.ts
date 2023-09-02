import express from 'express';
import dotenv from 'dotenv';
import sql from '../sql/sql_client';
import { auth, AuthenticatedRequest } from './auth';


dotenv.config();

const router = express.Router();

/**
 * @sql
 * CREATE TABLE IF NOT EXISTS public.following
 * (
 *     user_id integer NOT NULL,
 *     user_id_following integer NOT NULL,
 *     CONSTRAINT "following _pkey" PRIMARY KEY (user_id, user_id_following)
 * );
*/

type follow = {
    user_id: number,
    user_id_following: number
}

//get all users that actual user follows
/**
 * @openapi
 * /follow:
 *  get:
 *   description: get all users that a user follows
 *   security:
 *    - bearerAuth: []
 *   tags:
 *    - follow
 *   responses:
 *    200:
 *     description: OK
 *    400:
 *     description: Bad Request
 *    401:
 *     description: Unauthorized
 *    500:
 *     description: Internal Server Error
*/
router.get('/', auth, async (req: AuthenticatedRequest, res) => {
    const user_id = req.token?.user_id;
    if (!user_id) {
        res.status(401).send();
        return;
    }
    //get all users that a user follows
    // add username to the result of the query
    const following = await sql`SELECT following.user_id_following as follow , username FROM public.following
        INNER JOIN public.user ON following.user_id_following = public.user.id
        WHERE following.user_id = ${user_id}`;
    res.status(200).json(following);
    return;
});


//follow a user by id in url
/**
 * @openapi
 * /follow/{user_id}:
 *  post:
 *   summary: Follow a user by user_id
 *   security:
 *    - bearerAuth: []
 *   tags:
 *    - follow
 *   parameters:
 *    - in: path
 *      name: user_id
 *      schema:
 *       type: integer
 *      required: true
 *      description: The user_id of the user to follow
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
router.post('/:user_id', auth, async (req: AuthenticatedRequest, res) => {
    const user_id = req.token?.user_id || null;
    if (user_id == null) {
        res.status(401).send();
        return;
    }
    const user_id_following = parseInt(req.params.user_id);
    if (isNaN(user_id_following)) {
        res.status(400).send();
        return;
    }
    //check if user_id_following exists
    const user_id_following_exists = await sql`SELECT EXISTS(SELECT 1 FROM public.user WHERE id = ${user_id_following})`;
    if (!user_id_following_exists[0].exists) {
        res.status(404).send();
        return;
    }
    //follow user and check if insertion was successful
    const followed = await sql`INSERT INTO public.following (user_id, user_id_following)
        VALUES (${user_id}, ${user_id_following})
        ON CONFLICT (user_id, user_id_following) DO NOTHING
        RETURNING *`;
    if (followed.length === 0) {
        res.status(409).send("Already following user");
        return;
    }

    res.status(200).send('OK');
    return;
});

//unfollow a user by id in url
/**
 * @openapi
 * /follow/{user_id}:
 *  delete:
 *   description: unfollow a user by id in url
 *   security:
 *    - bearerAuth: []
 *   tags:
 *    - follow
 *   parameters:
 *    - in: path
 *      name: user_id
 *      schema:
 *       type: integer
 *      required: true
 *      description: user_id of the user
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
router.delete('/:user_id', auth, async (req: AuthenticatedRequest, res) => {
    const user_id = req.token?.user_id || null;
    if (user_id == null) {
        res.status(401).send();
        return;
    }
    const user_id_following = parseInt(req.params.user_id);
    if (isNaN(user_id_following)) {
        res.status(400).send();
        return;
    }
    //delete follow and check if deletion was successful
    const unfollowed = await sql`DELETE FROM public.following WHERE user_id = ${user_id} AND user_id_following = ${user_id_following} RETURNING *`;
    if (unfollowed.length === 0) {
        res.status(404).send();
        return;
    }
    res.status(200).send();
    return;
});

export default router;