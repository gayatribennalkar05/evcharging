// routes/bookingRoutes.js
const router = require('express').Router();
const ctrl   = require('../controllers/bookingController');
const { rateLimit, ipBookingCap, validateBooking, validateToken } = require('../middleware/security');

router.post('/',
  rateLimit(10, 60000),
  ipBookingCap,
  validateBooking,
  ctrl.create
);

router.get('/:token',
  rateLimit(40, 60000),
  validateToken,
  ctrl.getByToken
);

router.delete('/:token',
  rateLimit(10, 60000),
  validateToken,
  ctrl.cancel
);

router.post('/:token/review',
  rateLimit(5, 60000),
  validateToken,
  ctrl.addReview
);

module.exports = router;
