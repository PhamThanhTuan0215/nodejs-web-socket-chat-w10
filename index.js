require('dotenv').config()
const express = require("express")
const socketio = require('socket.io')

const app = express()
app.set('view engine', 'ejs')

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/chat', (req, res) => {
    res.render('chat')
})

const PORT = process.env.PORT || 8080
const httpServer = app.listen(PORT, () => console.log('http://localhost:' + PORT))
const io = socketio(httpServer)

io.on('connection', client => {
    console.log(`Client ${client.id} đã kết nối`)

    client.free = true
    client.loginAt = new Date().toLocaleTimeString()

    let users = Array.from(io.sockets.sockets.values())
        .map(socket => ({id: socket.id, username: socket.username, loginAt: socket.loginAt, free: socket.free}))
    console.log(users) // xem trong chrome

    client.on('disconnect', () => {
        console.log(`\t\t${client.id} đã thoát`)

        //thông báo cho tất cả các user còn lại trước khi thoát
        client.broadcast.emit('user-leave', client.id)
    })

    client.on('register-name', username => {
        client.username = username

        // gửi thông tin đăng ký cho tất cả các user còn lại
        client.broadcast.emit('register-name', {id: client.id, username: username})
    })

    //gửi danh sách user đang online cho người mới
    client.emit('list-users', users)

    //gửi thông tin người mới cho các users trước
    client.broadcast.emit('new-user', {id: client.id, username: client.username, loginAt: client.loginAt, free: client.free})

    client.on('open-chat', message => {
        console.log(`Received sample message from ${client.id}: ${message}`);
        client.emit('open-chat-response', { success: true });
    });
})