//express router, dotenv, postgres, passeport
import express from 'express';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import sql from '../sql/sql_client';

dotenv.config();

const saltRounds = process.env.SALT_ROUNDS || 10;
const passwordMinLength = process.env.MIN_PASSWORD_LENGTH || 8;

//type user
type user = {
    id: number,
    username: string,
    email: string,
    password: string,
    first_name: string,
    last_name: string,
    phone: string
}

const router = express.Router();

/**
 * @swagger
 * /auth/signup/local:
 *  post:
 *    summary: Create a new user with local authentication
 *    description: Create a new user with local authentication using email and password
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            required:
 *              - email
 *              - password
 *            properties:
 *              email:
 *                type: string
 *              username:
 *                type: string
 *              password:
 *                type: string
 *              firstName:
 *                type: string
 *              lastName:
 *                type: string
 *              phone:
 *                type: string
 *    responses:
 *      '201':
 *        description: User created successfully
 *      '400':
 *        description: Bad request. Email and password are required or password is too short or email already exists
 *      '500':
 *        description: Internal server error
 */
router.post('/signup/local', async (req, res) => {
    let { email, username, password, firstName, lastName, phone } = req.body;
    if (!email || !password) {
        res.status(400).send('Email and password are required');
        return;
    }
    if (password.length < passwordMinLength) {
        res.status(400).send(`Password must be at least ${passwordMinLength} characters`);
        return;
    }
    if (!username) {
        //auto generate username with random characters
        username = Math.random().toString(15).substring(12);
    }
    // bcrypt password
    password = await bcrypt.hash(password, saltRounds).catch((err) => {
        res.status(500).send('Internal server error');
    });
    // check if email already exists
    const emailExists = await sql<user[]>`SELECT * FROM public."user" WHERE email = ${email}`
    if (emailExists.length > 0) {
        res.status(400).send('Email already exists');
        return;
    }

    // insert user into database
    const result = await sql<user[]>`INSERT INTO public."user"(
	username, email, password, first_name, last_name, phone)
	VALUES (${username},${email},${password},${firstName || null},${lastName || null},${phone || null}) RETURNING *`;
    if (result.length === 0) {
        res.status(500).send('Internal server error');
        return;
    }
    res.status(201).send("User created successfully");
});

export default router;
