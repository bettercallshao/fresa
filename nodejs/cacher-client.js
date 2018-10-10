/*
 * module for intefacing with cacher
 */

const nng = require('nanomsg');
const msp = require('msgpack-lite')
const fs = require('fs')

class Client {
    constructor() {
        this.ip = ''
        this.config = {}
        this.req = nng.socket('req')
        this.sub = nng.socket('sub')
        this.params = {}

        this.req.on('data', function(buf) {
            // we expect the exact number of params in the config
            this.fromBuf(buf, this.config.Params.length)
        }.bind(this))

        this.sub.on('data', function(buf) {
            this.fromBuf(buf, 1)
        }.bind(this))
    }

    fromBuf(buf, n) {
        // make the multi object buffer into list
        buf = Buffer.concat([
            Buffer.from([0x90 + n * 2]),
            buf])
        var list = msp.decode(buf)

        // data comes in such order [key1 val1 key2 val2 ...]
        for (var i = 0; i < n; i++) {
            this.params[list[i * 2]] = list[i * 2 + 1]
        }
    }

    close() {
        this.req.close()
        this.sub.close()
    }

    connect(ip, config) {
        this.ip = ip
        this.config = config
        this.req.connect('tcp://' + ip + ':' + config.CacherCmdPort.toString())
        this.sub.connect('tcp://' + ip + ':' + config.CacherDatPort.toString())

        setTimeout(function() {
            // request for all params
            this.req.send(Buffer.from([0x0, 0x0]))
        }.bind(this), 100)
    }
}

module.exports = Client

/*
// test
fs.readFile('../config.json', function(err, data) {
    config = JSON.parse(data);
    var client = new Client()
    client.connect('localhost', config)

    var refresh = (client, cb) => {
        console.log(client.params)
        setTimeout(() => cb(client, cb), 1000)
    }
    refresh(client, refresh)
});
*/
