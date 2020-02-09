const jsonwebtoken = require('jsonwebtoken');
const Question = require('../models/questions');
const { secret } = require('../config');

class QuestionsCtl {

    async find(ctx) {
        const { per_page = 10 } = ctx.query;
        const page = Math.max(ctx.query.page * 1, 1) - 1;
        const perPage = Math.max( per_page * 1, 1);
        const q = new RegExp(ctx.query.q);
        ctx.body = await Question
            .find({ $or: [{title: q}, {description: q}] })
            .limit(perPage)
            .skip(page * perPage);
    }

    async checkQuestionExist(ctx, next) {
        const question = await Question.findById(ctx.params.id).select('+questioner');
        if (!question) {
            ctx.throw(404, '话题不存在!');
            ctx.state.question = question;
            await next();
        }
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query;
        const selectFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('');
        const Question = await Question.findById(ctx.params.id).select(selectFields);
        ctx.body = question;
    }

    async create(ctx) {
        ctx.verifyParams({
            title: { type: 'string', required: true },
            description: { type: 'string', required: false },
        });
        const question = new Question({ ...ctx.request.body, questioner: ctx.state.user._id }).save();
        ctx.body = question;
    }

    async checkQuestioner(ctx, next) {
        const { question } = ctx.state;
        if (question.questioner.toString() !== ctx.state.user._id) {
            ctx.throw(403, '没有权限');
            await next();
        }
    }

    async update(ctx) {
        ctx.verifyParams({
            title: { type: 'string', required: true },
            description: { type: 'string', required: false },
        });
        await ctx.state.question.update(ctx.request.body);
        ctx.body = ctx.state.question;
    }

    async delete(ctx) {
        const question = await Question.findByIdAndRemove(ctx.params.id);
        ctx.status = 204;
    }
}

module.exports = new QuestionsCtl();
