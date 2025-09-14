const socket = io()

// socket.on('countUpdated', count => {
//     console.log('client connected with count: ', count)
// })
//
// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('client clicked')
//
//     socket.emit('increment')
// })

socket.on('join', msg => console.log(msg))

const $form = document.querySelector('#form')
const $msg = document.querySelector('#clientMsg')
const $btn = document.querySelector('#form-btn')

const $msgs = document.querySelector('#messages')
const $msgTemplate = document.querySelector('#message-template').innerHTML
const $locationTemplate = document.querySelector('#location-template').innerHTML
const $listUserTemplate = document.querySelector('#list-user-template').innerHTML

const autoscroll = () => {
    const $newMsg = $msgs.lastElementChild

    const newMsgStyle = getComputedStyle($newMsg)
    const newMsgMargin = parseInt(newMsgStyle.marginBottom)
    const newMsgHeight = $newMsg.offsetHeight + newMsgMargin

    console.log($newMsg.offsetHeight, newMsgHeight, newMsgMargin)

    const visibleHeight = $msgs.offsetHeight
    const containerHeight = $msgs.scrollHeight
    const scrollOffset = $msgs.scrollTop + visibleHeight

    console.log(visibleHeight, containerHeight, scrollOffset)

    if(containerHeight - newMsgHeight <= scrollOffset) {
        $msgs.scrollTop = $msgs.scrollHeight
    }
}

socket.on('message', message => {
    const html = Mustache.render($msgTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('DD-MMM-YYYY HH:mm:ss')
    })
    $msgs.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', message => {
    const html = Mustache.render($locationTemplate, {
        username: message.username,
        locationUrl: message.url,
        createdAt: moment(message.createdAt).format('DD-MMM-YYYY HH:mm:ss')
    })
    $msgs.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('userData', ({ room, users }) => {
    const html = Mustache.render($listUserTemplate, {
        room,
        users
    })
    document.querySelector('#list-users').innerHTML = html
})

$form.addEventListener('submit', e => {
    e.preventDefault()

    // Disable button
    $btn.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', $msg.value, res => {
        // Enable button
        $btn.removeAttribute('disabled')
        $msg.value = ''
        $msg.focus()

        console.log('Message is sent to server!', res)
    })
})

// Share location
const $shareLocationBtn = document.querySelector('#share-location')

$shareLocationBtn.addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported')
    }

    $shareLocationBtn.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition(position => {
        socket.emit('sendLocation', {lat: position.coords.latitude, lng: position.coords.longitude}, res => {
            // console.log(res)
            $shareLocationBtn.removeAttribute('disabled')
        })
    })
})

// Room
const { username, room } = Qs.parse(window.location.search, { ignoreQueryPrefix: true })
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})
socket.on('userData', ({ room, users }) => {
    console.log(room)
    console.log(users)
})