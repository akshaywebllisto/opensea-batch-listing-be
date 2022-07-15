'use strict';
import 'dotenv/config';
import { verify } from 'jsonwebtoken';
import db from '../model/index';

const { TOKEN_KEY } = process.env;

export default async (req, res, next) => {
  const authorization = req.headers['x-access-token'] || req.headers.authorization;

  const { nonce, owner_address } = req.query;
  if (nonce == null && owner_address == null) throw res.status(400).send('Nonce and Wallet Address is Required!!');

  if (!authorization || authorization === undefined) {
    throw res.status(403).send('A Token is Required for Authentication');
  }

  const bearerToken = authorization.split(' ');
  if (!bearerToken[1]) throw res.status(403).send('Access Denied');
  try {
    const user = verify(bearerToken[1], nonce);

    if (user.nonce === nonce) return next();
  } catch (error) {
    throw res.status(401).send('Invalid Token');
  }
};
