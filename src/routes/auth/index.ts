import express, { Router } from 'express';

import { signinRouter } from './login';
import { registerRouter } from './register';
import { deleteAccountRouter} from './deleteAccount';
import { forgottenPasswordRouter } from './forgottenPassword';
import { resetPasswordRouter } from './resetPassword';

const authRoutes: Router = express.Router();

authRoutes.use(signinRouter, forgottenPasswordRouter, registerRouter, deleteAccountRouter, resetPasswordRouter);

export { authRoutes };
