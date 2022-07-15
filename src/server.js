'use strict';
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cron from 'node-cron';
import morgan from 'morgan';
import db from './model/index';

import OwnerRouter from './routes/OwnerRouter';
import OwnerController from './components/owner/OwnerController';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));
app.use(compression());

(async () => {
  try {
    await db.sequelize.sync({ alter: true });
    // console.log('All models were synchronized successfully.');
  } catch (error) {
    return new Error(error.message);
  }
  //crone-job
  cron.schedule('* * 0-4 * * *', async () => {
    // running every 4-hour
    await OwnerController.refetchOpenseaApiCronJob();
  });

  app.listen(port, (err) => {
    if (err) throw new Error(error.message);
    //   console.log(`🚀 Express-Server ready at http://localhost:${port}`);
    //   console.log('Start Coding with Happiness  :)');
  });
})();

app.get('/', (req, res, next) => {
  try {
    res.send('Welcome to HelloWorld!');
  } catch (error) {
    next(error);
  }
});

app.use('/owner', OwnerRouter);

app.use((req, res, next) => {
  return res.status(404).json({ success: false, message: 'Router Not Found' });
});

app.use((error, req, res, next) => {
  return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
});
