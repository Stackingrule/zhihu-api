const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const app = new Koa();
const routing = require('./routes');

app.use(bodyParser());
routing(app);

app.listen(3000, () => {
    console.log('程序启动在 3000 端口了！！！');
});
