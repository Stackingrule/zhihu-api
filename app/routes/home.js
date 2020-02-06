const Router = require('koa-router');
const router = new Router();
// const homeCtl = require('../controllers/home');
const { index, upload } = require('../controllers/home');

// router.get('/', homeCtl.index);

router.get('/', index);
router.post('/upload', upload);

module.exports = router;
