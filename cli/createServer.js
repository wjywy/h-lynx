const path = require('path')
const express = require('express')

const app = express();
app.use(express.static('cli'));
app.get('*', (_, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.js'));
})
app.listen(2024, () => {
    console.log('服务器启动成功', "http://localhost:2024");
});
