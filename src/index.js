const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const express = require('express')
const { generateMessage, generateLocationMessage } = require('../utils/message')
const { addUser, removeUser, getUsersInRoom, getUser } = require('../utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDir = path.join(__dirname, '../public')

app.use(express.static(publicDir))

let count = 0

// server (emit - sender) --> client (on - receiver) --> countUpdated
// client (emit - sender) --> server (on - receiver) --> increment

// server (emit) --> client (on) -- acknowledgements --> server
// client (emit) --> server (on) -- acknowledgements --> client

io.on('connection', socket => {
    console.log('Server connected')
    // socket.emit('countUpdated', count)
    //
    // socket.on('increment', () => {
    //     count++
    //
    //     // Sync without real-time
    //     // socket.emit('countUpdated', count)
    //
    //     // Sync with real-time
    //     io.emit('countUpdated', count)
    // })

    // Join room
    socket.on('join', (options, callback) => {
        const { user, error } = addUser({ id: socket.id, ...options })

        if(error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Welcome to the server!', 'Admin'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} joined room!`, 'Admin'))
        io.to(user.room).emit('userData', { room: user.room, users: getUsersInRoom(user.room) })

        callback()
    })

    // Message
    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', generateMessage(msg, user.username))
        callback('Server received!')
    })

    // Location
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)

        if(!location.lat || !location.lng) {
            return callback()
        }
        io.to(user.room).emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${location.lat},${location.lng}`, user.username))
        callback(`Your location: https://google.com/maps?q=${location.lat},${location.lng}`)
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`, 'Admin'))
            io.to(user.room).emit('userData', { room: user.room, users: getUsersInRoom(user.room) })
        }
    })
})


server.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})