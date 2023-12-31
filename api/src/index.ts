//typescript, dotenv, express, swagger-jsdoc, swagger-ui-express
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

import auth from './routers/auth';
import post from './routers/post';
import vote from './routers/vote';
import follow from './routers/follow';
import user from './routers/user';
import role from './routers/role';
import report from './routers/report';

// //test mail
// import { test } from './models/mail';
// test();

// dotenv.config();

const app = express();
app.use(cors({
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
}))
app.use(express.json());
const port = process.env.PORT || 3000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'casadiny-talks',
      version: '0.0.0',
      port: port,
    },
  },
  apis: ['src/**/*.ts']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use(['/openapi', '/api', '/doc'], swaggerUi.serve, swaggerUi.setup(swaggerDocs));



/**
 * hello world example
 * @swagger
 * /:
 *   get:
 *     description: hello world
 *     responses:
 *       '200':
 *         description: Success
 */
app.get('/', (req, res) => {
  res.send('Hello World!');
}
);

app.use('/auth', auth);
app.use('/post', post);
app.use('/vote', vote);
app.use('/follow', follow);
app.use('/user', user);
app.use('/role', role);
app.use('/report', report);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}
);
