const jsonwebtoken = require('jsonwebtoken');
const User = require('../models/users');
const Question = require('../models/questions');
const Answer = require('../models/answers');
const { secret } = require('../config');

class UsersCtl {
    async find(ctx) {
        const { per_page = 10 } = ctx.query;
        const page = Math.max(ctx.query.page * 1, 1) - 1;
        const perPage = Math.max( per_page * 1, 1);
        ctx.body = await User
            .find({ name: new RegExp(ctx.query.q) })
            .limit(perPage)
            .skip(page * perPage);
     }

    async findById(ctx) {
        const { fields = ''} = ctx.query;
        const populateStr = fields.split(';').filter(f => f).map(f => {
            if (f === 'employments') {
                return 'employments.company employments.job';
            }
            if (f === 'educations') {
                return 'educations.school educations.major';
            }
            return f;
        }).join(' ');
        const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('').populate(populateStr);
        const user = await User.findById(ctx.params.id).select(selectFields);
        if (!user) { ctx.throw(404, '用户不存在'); }
        ctx.body = user;
    }

    async checkOwner(ctx, next) {
        if (ctx.params.id !== ctx.state.user._id) {
            ctx.throw(403, '没有权限');
        }
        await next();
    }
    async create(ctx) {
        ctx.verifyParams({
            name: {type: 'string', required: true },
            password: { type: 'string', required: true }
        });
        const { name } = ctx.request.body;
        const repeatedUser = await User.findOne({name});
        if (repeatedUser) {
            ctx.throw(409, '用户已存在!!!');
        }
        const user = await new User(ctx.request.body).save();
        ctx.body = user;
    }

    async update(ctx) {
        ctx.verifyParams({
            name: {type: 'string', required: false},
            password: {type: 'string', required: false},
            avatar_url: {type: 'string', required: false},
            gender: {type: 'string', required: false},
            headline: {type: 'string', required: false},
            locations: {type: 'array', itemType: 'string', required: false},
            business: {type: 'string', required: false},
            employments: {type: 'array', itemType: 'object', required: false},
            educations: {type: 'array', itemType: 'object', required: false},
        });
        const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body);
        if (!user) { ctx.throw(404, '用户不存在'); }
        ctx.body = user;
    }

    async delete(ctx) {
        const user = await User.findByIdRemove(ctx.params.id);
        if (!user) { ctx.throw(404, '用户不存在'); }
        ctx.status = 204;
    }

    async login(ctx) {
        ctx.verifyParams({
            name: {type: 'string', required: true},
            password: {type: 'string', required: true}
        });
        const user = await User.findOne(ctx.request.body);
        if (!user) {
            ctx.throw(401, '用户名或密码不正确');
        }
        const {_id, name} = user;
        const token = jsonwebtoken.sign({_id, name}, secret, {expiresIn: '1d'});
        ctx.body = {token};
    }


    async listFollowing(ctx) {
        const user = await User.findById(ctx.params.id).select("+following").populate("following");
        if (!user) {
            ctx.throw(404, '用户不存在');
        }
        ctx.body = user.following;

    }

    async listFollowers(ctx) {
        const user = await User.find({ following: ctx.params.id });
        ctx.body = user;
    }

    // 关注
    async follow(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+following');
        if (!me.following.map(id => id.toString()).includes(ctx.params.id)) {
            me.following.push(ctx.params.id);
            me.save();
        }
        ctx.status = 204;
    }

    // 检查用户存在与否中间件
    async checkUserExist(ctx, next) {
        const user = await User.findById(ctx.params.id);
        if (!user) {
            ctx.throw(404, '用户不存在!');
        }
        await next();
    }

    async unfollow(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+following');
        const index = me.following.map(id => id.toString()).indexOf(ctx.params.id);
        if (index > -1) {
            me.following.splice(index, 1);
            me.save();
        }
        ctx.status = 204;
    }

    async listFollowingTopics(ctx) {
        const user = await User.findById(ctx.params.id).select("+followingTopics").populate("followingTopics");
        if (!user) {
            ctx.throw(404, '用户不存在');
        }
        ctx.body = user.followingTopics;

    }

    async followTopic(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+followingTopics');
        if (!me.followingTopics.map(id => id.toString()).includes(ctx.params.id)) {
            me.followingTopics.push(ctx.params.id);
            me.save();
        }
        ctx.status = 204;
    }

    async unfollowTopic(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+followingTopics');
        const index = me.following.map(id => id.toString()).indexOf(ctx.params.id);
        if (index > -1) {
            me.followingTopics.splice(index, 1);
            me.save();
        }
        ctx.status = 204;
    }


    // 列出问题
    async listQuestions(ctx) {
        const questions = await Question.find({ questioner: ctx.params.id });
        ctx.body = questions;
    }

    // 喜欢与不喜欢
    async likeAnswers(ctx, next) {
        const item = await User.findById(ctx.state.user._id).select("+likingAnswers");
        if (!item.likingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
            item.likingAnswers.push(ctx.params.id);
            item.save();
            /**
             * $inc：字段更新操作
             */
            await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: 1 } })
        }
        ctx.body = {
            code: 200,
            data: {
                message: "赞一个"
            }
        };
        await next()
    }
    async unlikeAnswers(ctx) {
        const item = await User.findById(ctx.state.user._id).select("+likingAnswers");
        const index = item.likingAnswers.map(id => id.toString()).indexOf(ctx.params.id);
        if (index !== -1) {
            item.likingAnswers.splice(index, 1);
            item.save();
            await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: -1 } })
        }
        ctx.body = {
            code: 200,
            data: {
                message: "取消成功"
            }
        }
    }
    async listLikingAnswers(ctx) {
        /**
         * populate: 引用其它集合中的文档(schema)
         */
        const user = await User.findById(ctx.params.id).select("+likingAnswers").populate("likingAnswers")
        if (!user) ctx.throw(404, "用户不存在")
        ctx.body = {
            code: 200,
            data: {
                answers: user.likingAnswers
            }
        }
    }
    // 攒与踩
    async dislikeAnswers(ctx, next) {
        const item = await User.findById(ctx.state.user._id).select("+dislikingAnswers")
        if (!item.dislikingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
            item.dislikingAnswers.push(ctx.params.id) // 点赞列表
            item.save()
        }
        ctx.body = {
            code: 200,
            data: {
                message: "踩一个"
            }
        }
        await next()
    }
    async undislikeAnswers(ctx) {
        const item = await User.findById(ctx.state.user._id).select("+dislikingAnswers")
        const index = item.dislikingAnswers.map(id => id.toString()).indexOf(ctx.params.id)
        if (index !== -1) {
            item.dislikingAnswers.splice(index, 1)
            item.save()
        }
        ctx.body = {
            code: 200,
            data: {
                message: "取消成功"
            }
        }
    }
    async listDislikingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+dislikingAnswers').populate('dislikingAnswers');
        if (!user) ctx.throw(404, "用户不存在");
        ctx.body = {
            code: 200,
            data: {
                answers: user.dislikingAnswers
            }
        }
    }


    // 收藏答案
    // async collectAnswer(ctx) {
    //     const item = await User.findById(ctx.state.user._id).select('collectingAnswers')
    //     if (!item.collectingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
    //         item.collectingAnswers.push(ctx.params.id)
    //         item.save()
    //     }
    //     ctx.body = {
    //         code: 200,
    //         data: {
    //             message: "收藏成功"
    //         }
    //     }
    // }
    // async uncollectAnswer(ctx) {
    //     const item = await User.findById(ctx.state.user._id).select("+collectingAnswers")
    //     const index = item.collectingAnswers.map(id => id.toString()).indexOf(ctx.params.id)
    //     if (index !== -1) {
    //         item.collectingAnswers.splice(index, 1)
    //         item.save()
    //     }
    //     ctx.body = {
    //         code: 200,
    //         data: {
    //             message: "取消成功"
    //         }
    //     }
    // }
    // async listCollectingAnswers(ctx) {
    //     const user = await User.findById(ctx.params.id).select('collectingAnswers').populate('collectingAnswers')
    //     if (!user) ctx.throw(404, "用户不存在")
    //     ctx.body = {
    //         code: 200,
    //         data: {
    //             collects: user.collectingAnswers
    //         }
    //     }
    // }
}

module.exports = new UsersCtl();
