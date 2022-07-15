'use strict';
import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const salt = bcrypt.genSaltSync(10);
const emailRegex =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
const passwordRegex = /^(?=(.*[a-z]){1,})(?=(.*[A-Z]){1,})(?=(.*[0-9]){1,})(?=(.*[!@#$%^&*()\-__+.]){1,}).{8,}$/;

class GlobalFunctions {
  constructor() {
    this.emailRegex = emailRegex;
    this.passwordRegex = passwordRegex;
  }

  EmailRegex(email) {
    return this.emailRegex.test(email);
  }

  PasswordRegex(password) {
    return this.passwordRegex.test(password);
  }

  GeneratePassword(pass) {
    return bcrypt.hashSync(pass, salt);
  }

  ComparingPassword(password, comparePassword) {
    return bcrypt.compareSync(password, comparePassword);
  }

  GenerateInviteToken() {
    const randomString = crypto.randomBytes(16).toString('hex');
    return randomString;
  }

  GenerateJWTToken(owner_address, nonce) {
    try {
      const token = jwt.sign({ owner_address, nonce }, nonce, { expiresIn: '24h' });
      return token;
    } catch (error) {
      return new Error(error.message);
    }
  }

  GenerateUniqueString(length) {
    const uniqueString = Math.round(Math.random() * 36 ** length)
      .toString(36)
      .toUpperCase();
    return uniqueString;
  }

  RandomNumber(range) {
    return Math.floor(Math.random() * range);
  }

  FindArrayIndexValue = (arr, item) => {
    const index = arr.indexOf(item);
    return index !== -1 && arr.splice(index, 1);
  };

  GetUserName(st) {
    const str = st.split('@');
    return str[0];
  }

  DateValidation(date) {
    if (!dayjs(date, ['DD-MM-YYYY', 'YYYY-MM-DD']).isValid()) throw new ApolloError('Invalid Date format');
    const newDatesFormate = new Date(dayjs.utc(date).utcOffset(330).format('YYYY-MM-DD HH:mm'));
    return newDatesFormate;
  }
}

const GlobalController = new GlobalFunctions();
export default GlobalController;
