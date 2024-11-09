import express, { Router } from 'express';

import { signinRouter } from './login';
import { registerRouter } from './register';
import { deleteAccountRouter} from './deleteAccount';
import { checkToken } from '../../core/middleware';
import { forgottenPasswordRouter } from './forgottenPassword';
import { resetPasswordRouter } from './resetPassword';

const authRoutes: Router = express.Router();

authRoutes.use(signinRouter);
authRoutes.use(registerRouter);
authRoutes.use('/delete', checkToken, deleteAccountRouter);
authRoutes.use(forgottenPasswordRouter);
authRoutes.use(checkToken, resetPasswordRouter);

export { authRoutes };



