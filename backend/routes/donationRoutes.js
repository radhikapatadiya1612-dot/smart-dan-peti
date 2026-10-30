const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

router.post('/', donationController.createDonation);
router.get('/', donationController.getAllDonations);
router.get('/ticker', donationController.getRecentTicker);
router.get('/receipt/:query', donationController.getReceipt);
router.get('/generate-qr', donationController.generatePaymentQr);

module.exports = router;
