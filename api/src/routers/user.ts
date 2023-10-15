'use strict';

import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import sql from '../sql/sql_client';
import { auth, AuthenticatedRequest } from './auth';


/**
 * @sql
 *
 * REATE TABLE IF NOT EXISTS public."user"
 * (
 *     id serial NOT NULL,
 *     username character varying(32) COLLATE pg_catalog."default" NOT NULL,
 *     email character varying(128) COLLATE pg_catalog."default" NOT NULL,
 *     password character varying(72) COLLATE pg_catalog."default",
 *     first_name character varying(24) COLLATE pg_catalog."default",
 *     last_name character varying(24) COLLATE pg_catalog."default",
 *     phone character varying(24) COLLATE pg_catalog."default",
 *     CONSTRAINT user_pkey PRIMARY KEY (id)
 * );
 *
 * @sql
 * CREATE TABLE IF NOT EXISTS public.following
 * (
 *     user_id integer NOT NULL,
 *     user_id_following integer NOT NULL,
 *     CONSTRAINT "following _pkey" PRIMARY KEY (user_id, user_id_following)
 * );
 *
 */

const router = express.Router();
dotenv.config();

// GET /user
/**
* @openapi
* /user:
*   get:
*     summary: Get user info
*     description: Get user info
*     tags:
*       - user
*     security:
*       - bearerAuth: []
*     responses:
*       200:
*         description: User info
*         content:
*           application/json:
*             schema:
*               type: object
*               properties:
*                 id:
*                   type: integer
*                   description: User ID
*                 username:
*                   type: string
*                   description: Username
*                 email:
*                   type: string
*                   description: Email
*                 first_name:
*                   type: string
*                   description: First name
*                 last_name:
*                   type: string
*                   description: Last name
*                 phone:
*                   type: string
*                   description: Phone number
*       400:
*         description: Invalid token
*       404:
*         description: User not found
*/
router.get('/', auth, async (req: AuthenticatedRequest, res) => {
    const user_id = req.token?.user_id || null;
    console.log(user_id);
    if (user_id === null) {
        res.status(400).send({ error: 'Invalid token' });
        return;
    }
    const user = await sql`SELECT id, username, email, first_name, last_name, phone FROM "user" WHERE id = ${user_id} LIMIT 1`
    if (user.count === 0) {
        res.status(404).send({ error: 'User not found' });
        return;
    }
    res.json(user[0]);
});

// GET /api/user/:username
/**
 * @openapi
 * /user/{username}:
 *  get:
 *   summary: Get user info
 *   description: Get user info
 *   tags:
 *    - user
 *   parameters:
 *    - in: path
 *      name: username
 *      schema:
 *       type: string
 *       required: true
 *   security:
 *    - bearerAuth: []
 *   responses:
 *    200:
 *     description: User info
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         id:
 *          type: integer
 *          description: User ID
 */
router.get('/:username', async (req, res) => {
    const username = req.params.username;
    //user base info and number of followers (with join)
    const user = await sql`
    SELECT id, username, COUNT(f.user_id_following) AS followers FROM "user" u
        LEFT JOIN following f ON u.id = f.user_id_following
        WHERE username = ${username}
        GROUP BY u.id
        LIMIT 1`
    if (user.count === 0) {
        res.status(404).send({ error: 'User not found' });
        return;
    }
    res.send(user[0]);
});


export default router;