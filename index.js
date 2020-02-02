const Koa = require('koa');

const app = new Koa();

app.use(async (ctx, next) => {
    await next();
    console.log(1);
    ctx.body = 'Hello World! API'
});

app.use(async (ctx) => {
    console.log(2);
})

app.listen(3000);
