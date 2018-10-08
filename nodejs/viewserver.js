/*
 * fresa nodejs demo  
 * 1. serves a minimal html view
 * 2. serves device list
 * 3. serves param map
 */

const dgram = require('dgram')
const stat = require('serve-handler')
const http = require('http')
const cacherClient = require('./cacherclient')

// states
devices = {}

// utils
function mapToList(m) {
    // frontend doesn't like maps
    return Object.keys(m).map(function(key) {
        return { key: key, value: m[key] }
    })
}

// ===== UDP ====
// udp broadcast is used per design
const udp = dgram.createSocket('udp4')

// bind and send (dgram package requires to bind first, port number is abitrary)
udp.bind({ port: 5678 }, () => {
    // only do these after bind takes effect
    udp.setBroadcast(true)
})

// receive config of device as json
udp.on('message', function(message, remote) {
    config = JSON.parse(message)
    addr = remote.address
    name = addr + ': ' + config.DeviceType + ': ' + config.VersionStr
    devices[addr] = { config: config, name: name }
})

// broadcast to solicit devices
function udpSend() {
    // clear device list
    devices = {}
    // 9000 is the hard-coded greeter port
    udp.send(Buffer.from(''), 0, 0, 9000, '255.255.255.255', (err, bytes) => {
        if (err) throw err
    })
}

// ===== NANOMSG ====
cacher = new cacherClient()

// ===== HTTP ====
// very simple http server that serves
// 1. static
// 2. /devices -> device list as json
// 3. /device/<addr> -> selects device
// 4. /params -> param map as json
const server = http.createServer((request, response) => {
    var url = request.url
    if (url == '/devices') {
        // collect udp response and reply in 0.5 seconds
        udpSend()
        setTimeout(() => {
            response.end(JSON.stringify(mapToList(devices)))
        }, 500)
    } else if (url.startsWith('/device/')) {
        addr = url.slice(8)
        // connect to the addr
        cacher.connect(addr, devices[addr].config)
        // respond with addr and config
        response.end(JSON.stringify({ key: addr, value: devices[addr] }))
    } else if (url == '/params') {
        response.end(JSON.stringify(mapToList(cacher.params)))
    } else {
        stat(request, response, { public: 'public' })
    }
})
 
server.listen(3000, () => {
  console.log('View server running at 3000')
})
