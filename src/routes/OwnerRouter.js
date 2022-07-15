'use strict';
import express from 'express';
import Auth from '../middleware/Auth';
import OwnerController from '../components/owner/OwnerController';

const router = express.Router();

router.post('/uuid', OwnerController.generateNonce);

router.post('/login', OwnerController.generateTokenAndLogin);

router.get('/assets', OwnerController.getOwner);

router.get('/events', OwnerController.getEvents);

router.post('/totalValue', OwnerController.totalOwnerPortfolioValue);

router.post('/net-profit', OwnerController.netProfitAndLoss);

export default router;
