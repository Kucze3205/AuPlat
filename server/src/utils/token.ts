import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AuthTokenPayload } from '../types/index.js';

export const signToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
