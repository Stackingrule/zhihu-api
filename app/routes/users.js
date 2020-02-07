const Router = require('koa-router');
const jwt= require('koa-jwt');
const router = new Router({prefix: '/users'});
const {
        find, findById,
        create, update,
        delete: del,
        login, checkOwner,
        listFollowing, follow,
        unfollow, listFollowers
        } = require('../controllers/users');
const { secret } = require('../config');
const auth = jwt({ secret });

router.get('/', find);

router.post('/', create);

router.get('/:id', findById);

router.patch('/:id', auth, checkOwner,update);

router.delete('/', auth, checkOwner,del);

router.post('/login', login);

router.get('/:id/following', listFollowing);

router.get('/:id/followers', listFollowers);

router.put('/following/:id', auth, follow);

router.delete('/following/:id', auth, unfollow);

module.exports = router;
