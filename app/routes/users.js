const Router = require('koa-router');
const jwt= require('koa-jwt');
const router = new Router({prefix: '/users'});
const {
        find, findById,
        create, update,
        delete: del,
        login, checkOwner,
        listFollowing, follow,
        checkUserExist,
        unfollow, listFollowers,
        listFollowingTopics,
        followTopic, unfollowTopic,
        listQuestions,
        listLikingAnswers, likeAnswers, unlikeAnswers,
        listDislikingAnswers, dislikeAnswers, undislikeAnswers,
        } = require('../controllers/users');

const { checkTopicExist } = require('../controllers/topics');
const { checkAnswerExist } = require('../controllers/answers');
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

router.put('/following/:id', auth, checkUserExist, follow);

router.delete('/following/:id', auth, checkUserExist, unfollow);

router.get('/:id/followingTopics', listFollowingTopics);

router.put('/followingTopics/:id', auth, checkTopicExist, followTopic);

router.delete('/followingTopics/:id', auth, checkTopicExist, unfollowTopic);

router.get('/:id/questions', listQuestions);

// 赞 、踩
router.get("/:id/likeAnswers", auth, checkOwner, listLikingAnswers);

router.put("/likingAnswers/:id", auth, checkAnswerExist, likeAnswers, undislikeAnswers);

router.delete("/likingAnswers/:id", auth, checkAnswerExist, unlikeAnswers);

router.get("/:id/dislikingAnswers", auth, checkOwner, listDislikingAnswers);

router.put("/dislikingAnswers/:id", auth, checkAnswerExist, dislikeAnswers, unlikeAnswers);

router.delete("/dislikingAnswers/:id", auth, checkAnswerExist, undislikeAnswers);

module.exports = router;
