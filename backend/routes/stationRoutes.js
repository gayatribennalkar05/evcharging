// routes/stationRoutes.js
const router = require('express').Router();
const ctrl   = require('../controllers/stationController');
const { rateLimit } = require('../middleware/security');

router.use(rateLimit(80, 60000));
router.get('/',           ctrl.getAll);
router.get('/stats',      ctrl.getStats);
router.get('/:id',        ctrl.getOne);
router.get('/:id/slots',  ctrl.getSlots);

module.exports = router;
