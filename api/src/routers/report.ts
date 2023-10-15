'use strict';

import express from 'express';
import dotenv from 'dotenv';
import sql from '../sql/sql_client';
import { auth, AuthenticatedRequest } from './auth';
import { AuthenticatedAndRolesRequest, need_roles, has_aceess } from './role';

dotenv.config();

const router = express.Router();

/**
 * @sql
 * CREATE TABLE IF NOT EXISTS public.reported_post
 * (
 *     post_id character varying(22),
 *     user_id integer,
 *     reason character varying,
 *     datetime timestamp with time zone,
 *     PRIMARY KEY (post_id, user_id)
 * );
 */

type reported_post = {
    post_id: string,
    user_id: number,
    reason: string,
    datetime: Date
}

//! user (report a post(with message in option))

/**
 * @openapi
 * /report/{post_id}:
 *   post:
 *     description: report a post by id in url
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - report
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *              reason:
 *                type: string
 *                description: reason of the report
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 */
router.post('/:post_id', auth, async (req: AuthenticatedRequest, res) => {
    const user_id = req.token?.user_id || null;
    const post_id = req.params.post_id;
    const { reason } = req.body;

    if (user_id == null) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    //check if post exist
    const post = await sql`SELECT * FROM public.post WHERE id = ${post_id}`;
    if (post.count === 0) {
        res.status(400).json({ error: 'bad post id' });
        return;
    }
    //insert or update report
    const report = await sql`INSERT INTO public.reported_post (post_id, user_id, reason, datetime)
    VALUES (${post_id}, ${user_id}, ${reason || ""}, NOW())
    ON CONFLICT (post_id, user_id)
    DO UPDATE SET reason = ${reason || ""}, datetime = NOW() RETURNING *`;
    if (report.count === 0) {
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }
    res.status(200).json(report[0]);
});


//! modo (wiew reports, delete reports, soft delete posts(in post file))

/**
 * @openapi
 * /report/modo:
 *   get:
 *     description: get all reports
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - report
 *     responses:
 *       200:
 *         description: OK
 *       401:
 *         description: Unauthorized
 */
router.get('/modo', auth, need_roles, async (req: AuthenticatedAndRolesRequest, res) => {
    const user_id = req.token?.user_id || null;
    const roles = req.roles || [];

    if (user_id == null) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    //check if has othority to view reports
    if (await has_aceess(roles, [1, 2], user_id) === false) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    //get all reports
    const reports = await sql<reported_post[]>`SELECT * FROM public.reported_post`;
    res.status(200).json(reports);
    return
});


//delete a report
/**
 * @openapi
 * /report/modo/{post_id}/{user_id}:
 *   delete:
 *     description: delete a report by post_id
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - report
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *       - name: user_id
 *         in: path
 *         required: true
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: report not found
 */
router.delete('/modo/:post_id/:user_id', auth, need_roles, async (req: AuthenticatedAndRolesRequest, res) => {
    const user_id = req.token?.user_id || null;
    const roles = req.roles || [];
    const post_id = req.params.post_id;
    const report_user_id = req.params.user_id;

    if (user_id == null) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    //check if has othority to delete reports
    if (await has_aceess(roles, [1, 2], user_id) === false) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    //check if report exist
    const report = await sql`SELECT * FROM public.reported_post WHERE post_id = ${post_id} AND user_id = ${report_user_id}`;
    if (report.count === 0) {
        res.status(404).json({ error: 'report not found' });
        return;
    }
    //delete report
    const deleted_report = await sql`DELETE FROM public.reported_post WHERE post_id = ${post_id} AND user_id = ${report_user_id}`;
    if (deleted_report.count === 0) {
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }
    res.status(200).json({ message: 'report deleted' });
    return
});

export default router;