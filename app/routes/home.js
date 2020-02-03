const Router = require('koa-router');
const router = new Router();
// const homeCtl = require('../controllers/home');
const { index } = require('../controllers/home');

// router.get('/', homeCtl.index);

router.get('/', index);

module.exports = router;
