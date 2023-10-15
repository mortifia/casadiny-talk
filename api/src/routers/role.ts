'use strict';

import express from 'express';
import dotenv from 'dotenv';
import sql from '../sql/sql_client';
import { auth, AuthenticatedRequest } from './auth';

dotenv.config();

const router = express.Router();


export type Role = {
    role_id: number,
    role_name: string,
    role_description: string
}



//create a new role
// only admin users can create a new role
/**
 * @openapi
 * /role/admin:
 *   post:
 *     description: create a new role
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_name:
 *                 type: string
 *               role_description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
*/
router.post('/admin', auth, need_roles, async (req: AuthenticatedAndRolesRequest, res) => {
    const user_id = req.token?.user_id;
    const { role_name, role_description } = req.body;
    if (user_id == null) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    if (role_name == null || role_description == null) {
        res.status(400).json({ error: 'Bad Request' });
        return;
    }
    //check if user has authority to create role
    if (await has_aceess(req.roles || [], [1], user_id) === false) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    //check if role already exists
    const role = await sql`SELECT role_id FROM public.role WHERE role_name = ${role_name}`;
    if (role.count !== 0) {
        res.status(400).json({ error: 'Role already exists' });
        return;
    }
    //create new role
    const new_role = await sql`INSERT INTO public.role (role_name, role_description) VALUES (${role_name}, ${role_description}) RETURNING *`;
    res.status(201).json(new_role[0]);
    return;
});

// update a role
// only admin users and role 1 (admin) can update a role
/**
 * @openapi
 * /role/admin:
 *   put:
 *     summary: Update a role
 *     description: Update a role
 *     tags:
 *       - role
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_id:
 *                 type: integer
 *                 required: true
 *               role_name:
 *                 type: string
 *               role_description:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.put('/admin', auth, need_roles, async (req: AuthenticatedAndRolesRequest, res) => {
    const user_id = req.token?.user_id;
    const { role_id, role_name, role_description } = req.body;
    if (user_id == null) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    if (role_id == null) {
        res.status(400).json({ error: 'Bad Request' });
        return;
    }
    //check if user has authority to update role
    if (await has_aceess(req.roles || [], [1], user_id) === false) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    //check if role exists
    const role = (await sql<Role[]>`SELECT * FROM public.role WHERE role_id = ${role_id}`);
    if (role.count === 0) {
        res.status(400).json({ error: 'Role does not exist' });
        return;
    }
    //update role
    const updated_role = await sql`UPDATE public.role SET role_name = ${role_name || role[0].role_name}, role_description = ${role_description || role[0].role_description} WHERE role_id = ${role_id} RETURNING *`;
    if (updated_role.count === 0) {
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }
    res.status(200).json(updated_role[0]);
});

// delete a role



export async function roles(user_id: number) {
    // return all roles id of a user
    return await sql<Role[]>`
        SELECT r.* FROM public.user_role ur
        JOIN public.role r ON ur.role_role_id = r.role_id
        WHERE user_id = ${user_id}
    `;
}

export interface AuthenticatedAndRolesRequest extends AuthenticatedRequest {
    roles?: Role[];
}

export async function need_roles(req: AuthenticatedAndRolesRequest, res: express.Response, next: express.NextFunction) {
    // add roles to req
    const user_id = req.token?.user_id;
    if (user_id == null) {
        next();
        return;
    }
    req.roles = await roles(user_id);
    next();
    return;

}

export async function has_aceess(roles: Role[], role_id: number[], user_id: number) {
    //return true if user has access to one of the roles
    //superadmin has access to all roles

    //check if in role user have one of the roles
    if (roles.some((role: Role) => role_id.includes(role.role_id))) {
        return true;
    }
    //check if user is superadmin
    const user = await sql`SELECT admin FROM public.user WHERE id = ${user_id} AND admin = true`;
    if (user.count !== 0) {
        return true;
    }
    return false;
}

export default router;
