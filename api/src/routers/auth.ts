'use strict';

//local signin/signup bearer strategy with passport
import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import sql from '../sql/sql_client';

dotenv.config();

const saltRounds = parseInt(process.env.SALT_ROUNDS || '10');
const jwtSecret = process.env.JWT_SECRET || 'secret';
const acessTokenExpiresInSeconds = parseInt(process.env.ACESS_TOKEN_EXPIRES_IN_SECONDS || '3600');
const refreshTokenExpiresInSeconds = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS || '31556952');



const router = express.Router();

/**
 * @sql
 * CREATE TABLE IF NOT EXISTS public."user"
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
 */

/**
 * @sql
 * CREATE TABLE IF NOT EXISTS public."authorization"
 * (
 *     user_id integer NOT NULL,
 *     acess_token_id smallint NOT NULL,
 *     acess_token_key character varying(128) NOT NULL,
 *     acess_token_expires timestamp with time zone NOT NULL,
 *     refresh_token character varying(128) NOT NULL,
 *     refresh_token_expires timestamp with time zone NOT NULL,
 *     PRIMARY KEY (user_id, acess_token_id)
 * );
*/

type token = {
    user_id: number,
    acess_token_id: number,
    acess_token_key: string,
    acess_token_expires: Date,
    refresh_token: string,
    refresh_token_expires: Date
};

async function generateTokens(user_id: number) {
    //get an array of acess_token_id of user from database
    const acessTokenIdStored = (await sql<token[]>`SELECT acess_token_id FROM "authorization" WHERE user_id = ${user_id}`)
        .map(token => token.acess_token_id);
    //random value between -32768 to +32767 and not in acessTokenIdStored array
    //do while loop to make sure acessTokenId is unique to user
    let acessTokenId = 0;
    do {
        acessTokenId = Math.floor(Math.random() * 65535) - 32768;
    } while (acessTokenIdStored.includes(acessTokenId));

    //generate acess token passkey
    const acessTokenKey = crypto.randomBytes(64).toString('hex');

    //generate acess token expiration timestampz
    const acessTokenExpires = new Date(Date.now() + acessTokenExpiresInSeconds * 1000);

    //generate refresh token passkey
    const refreshToken = crypto.randomBytes(64).toString('hex');

    //generate refresh token expiration timestampz
    const refreshTokenExpires = new Date(Date.now() + (refreshTokenExpiresInSeconds * 1000));

    const tokens = {
        acessToken: jwt.sign({ user_id, acessTokenId, acessTokenKey }, jwtSecret, { expiresIn: acessTokenExpiresInSeconds }),
        token_type: 'Bearer',
        expires_in: acessTokenExpiresInSeconds,
        refreshToken: {
            token: refreshToken,
            expires: refreshTokenExpires
        }
    }
    //insert tokens into database
    await sql` INSERT INTO "authorization" (user_id, acess_token_id, acess_token_key, acess_token_expires, refresh_token, refresh_token_expires)
        VALUES (${user_id}, ${acessTokenId}, ${acessTokenKey}, ${acessTokenExpires}, ${await bcrypt.hash(refreshToken, saltRounds)}, ${refreshTokenExpires})`;
    return tokens;
}


/**
 * @openapi
 * /auth/signup/local:
 *   post:
 *     summary: Signup with local strategy
 *     description: Signup with local strategy
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       '201':
 *         description: User created successfully
 *       '400':
 *         description: Email or password is empty
 *       '409':
 *         description: Email already exists
 *       '500':
 *         description: Internal server error
*/
router.post('/signup/local', async (req, res) => {
    const { username, email, password, first_name, last_name, phone } = req.body;
    //check if email or password is empty
    if (!email || !password) {
        return res.status(400).json({ error: 'Email or password is empty' });
    }
    //check if email already exists
    const userExist = await sql`SELECT * FROM "user" WHERE email = ${email}`;
    if (userExist.length > 0) {
        return res.status(409).json({ error: 'Email already exists' });
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //if no username, generate username by random
    if (!username) {
        const username = Math.random().toString(36).substring(2, 15);
        console.debug(`Generated username: ${username}`);
    }

    //insert user into database
    const newUser = await sql`
        INSERT INTO "user" (username, email, password, first_name, last_name, phone)
        VALUES (${username}, ${email}, ${hashedPassword}, ${first_name}, ${last_name}, ${phone})
        RETURNING id, username, email, first_name, last_name, phone`;
    //respond with 201 status code
    return res.status(201).json('User created successfully');
});

/**
 * @openapi
 * /auth/signin/local:
 *  post:
 *   summary: Signin with local strategy
 *   description: Signin with local strategy
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       required:
 *        - email
 *        - password
 *       properties:
 *        email:
 *         type: string
 *        password:
 *         type: string
 *   responses:
 *    '200':
 *     description: User logged in successfully
 *    '400':
 *     description: Email or password is empty
 *    '401':
 *     description: Email or password is incorrect
 *    '500':
 *     description: Internal server error
 */
router.post('/signin/local', async (req, res) => {
    const { email, password } = req.body;
    //check if email or password is empty
    if (!email || !password) {
        return res.status(400).json({ error: 'Email or password is empty' });
    }
    //get user from database
    const user = await sql`SELECT * FROM "user" WHERE email = ${email}`;
    //check if user exists
    if (user.length === 0) {
        return res.status(401).json({ error: 'Email or password is incorrect' });
    }
    //check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user[0].password);
    if (!isPasswordCorrect) {
        return res.status(401).json({ error: 'Email or password is incorrect' });
    }

    //generate access token and refresh token
    const token = await generateTokens(user[0].id);
    res.status(200).json(token);
});







export default router;
