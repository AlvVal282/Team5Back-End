import express, { Router } from 'express';

import { signinRouter } from './login';
import { registerRouter } from './register';
import { resetPasswordRouter } from './resetPassword';
import { forgottenPasswordRouter } from './forgottenPassword';

const authRoutes: Router = express.Router();

authRoutes.use(signinRouter); 
authRoutes.use (registerRouter);
authRoutes.use (resetPasswordRouter);
authRoutes.use (forgottenPasswordRouter);


export { authRoutes };
