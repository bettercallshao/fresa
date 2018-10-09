from config import Config
import watcher
from datetime import datetime
import os
import time
import msgpack as msp
import nanomsg as nng

def MspToStr(sm, data):
    # decode (ask for a tuple), let it crash here if can't unpack
    upk = msp.Unpacker()
    upk.feed(data)
    verblevel = upk.unpack()
    service = upk.unpack()
    timestamp = upk.unpack()
    line = upk.unpack()
    servicename = ''
    try:
        servicename = sm[service]
    except(Exception):
        pass
    timestr = datetime.utcfromtimestamp(timestamp / 1000.0).isoformat()
    sline = line.decode('utf-8')
    return '[%d][%s][%s] %s' % (verblevel, servicename, timestr, sline)

class LogSender(object):
    def __init__(self, config, servicename):
        # find service key from service name
        self.service = 0
        for s in config.Services:
            if s['Name'] == servicename:
                self.service = s['Key']
                break
        self.push = nng.Socket(nng.PUSH)
        self.push.send_timeout = 1
        self.push.connect('tcp://localhost:%d' % config.LoggerCmdPort)
        time.sleep(0.1)

    def Send(self, data, verblevel = 0):
        # take time.time() (seconds since epoc) as time stamp, ignore sub milli
        pkr = msp.Packer(autoreset = False)
        pkr.pack(verblevel)
        pkr.pack(self.service)
        pkr.pack(int(datetime.utcnow().timestamp() * 1000))
        pkr.pack(data)
        try:
            self.push.send(pkr.bytes())
        except(nng.NanoMsgAPIError):
            pass

def OpenNewFile(config):
    path = config.LogPath + '/' + datetime.now().isoformat() + '.log'
    # don't handle exception and let it crash
    f = open(path, 'w')
    return f

def Serve(config):
    # make sure the dir exists
    if not os.path.exists(config.LogPath):
        os.makedirs(config.LogPath)

    petter = watcher.Petter(config, 'logger')
    log = LogSender(config, 'logger')

    # map of service key to name
    sm = {}
    for s in config.Services:
        sm[s['Key']] = s['Name']

    pull = nng.Socket(nng.PULL)
    pullurl = 'tcp://*:%d' % config.LoggerCmdPort
    pull.bind(pullurl)

    pub = nng.Socket(nng.PUB)
    puburl = 'tcp://*:%d' % config.LoggerDatPort
    pub.bind(puburl)

    f = OpenNewFile(config)
    count = 0

    log.Send('Server started: ' + config.VersionStr +
             ', PULL: ' + pullurl +
             ', PUB: ' + puburl)

    try:
        while True:
            # wait for new msg
            data = pull.recv()

            # check if we want a new file
            l = len(data)
            count += l
            if count > 10*1024*1024:
                count = l
                # get new file
                f.close()
                f = OpenNewFile(config)

            # unpack
            s = MspToStr(sm, data)

            # write to file
            print(s)
            print(s, file=f)

            # broadcast
            pub.send(data)

    except(KeyboardInterrupt):
        pass

    print('Logger out', file=f)
    f.close()
    petter.Stop()

def Test():
    sm = {100: 'AA'}
    m = msp.packb([1, 100, 1111, 'some text'])[1:]
    s = MspToStr(sm, m)
    assert(s == '[1][AA][1970-01-01T00:00:01.111000] some text')

if __name__ == '__main__':

    # always run this short test
    Test()

    c = Config()
    Serve(c)
