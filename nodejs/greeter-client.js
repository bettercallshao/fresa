/*
 * module for interfacing with greeter
 */
const dgram = require('dgram')

class Client {
    constructor() {
        // state
        this.devices = {}

        // udp broadcast is used per design
        this.udp = dgram.createSocket('udp4')

        // bind and send (dgram package requires to bind first, port number is abitrary)
        this.udp.bind({ port: null }, function() {
            // only do these after bind takes effect
            this.udp.setBroadcast(true)
        }.bind(this))

        // receive config of device as json
        this.udp.on('message', function(message, remote) {
            var config = JSON.parse(message)
            var addr = remote.address
            var name = addr + ': ' + config.DeviceType + ': ' + config.VersionStr
            this.devices[addr] = { config: config, name: name }
        }.bind(this))
    }

    // broadcast to solicit devices
    search(cb) {
        // clear device list
        this.devices = {}
        // 9000 is the hard-coded greeter port
        this.udp.send(Buffer.from(''), 0, 0, 9000, '255.255.255.255', (err, bytes) => {
            if (err) throw err
        })
        // call back after 0.5 second
        setTimeout(cb, 500)
    }

    close() {
        this.udp.close()
    }
}

module.exports = Client

/*
// test
var client = new Client(55966)
client.search(() => { console.log(client.devices); client.close() })
*/
