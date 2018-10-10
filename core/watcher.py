from config import Config
import logger
from datetime import datetime
from threading import Thread
import time
import msgpack as msp
import nanomsg as nng

# frontend
class Petter(object):
    def __init__(self, config, name):
        self.alive = True
        self.thread = Thread(target = BlockPet, args = (self, config, name))
        self.thread.start()

    def Stop(self):
        self.alive = False
        self.thread.join()

def BlockPet(self, config, name):
    data = None
    for s in config.Services:
        if s['Name'] == name:
            data = msp.packb(s['Key'])
    # can't continue without an entry in config
    if not data:
        return

    # keep petting for ever
    req = nng.Socket(nng.REQ)
    req.send_timeout = 100
    req.recv_timeout = 400
    req.connect('tcp://localhost:%d' % config.WatcherCmdPort)
    while self.alive:
        time.sleep(2.5)
        req.send(data)
        try:
            req.recv()
        except(nng.NanoMsgAPIError):
            pass

class StopWatch(object):
    def __init__(self, stickon = False):
        self.alive = True
        self._timestamp = datetime.now()
        self._stickon = stickon

    def Pet(self):
        self._timestamp = datetime.now()

    def Calculate(self):
        if self._stickon:
            return False
        else:
            now = datetime.now()
            delta = now - self._timestamp
            alive = delta.total_seconds() < 5
            if self.alive != alive:
                self.alive = alive
                return True
            else:
                return False

def PackMap(sm):
    # pack everything back to back
    pkr = msp.Packer(autoreset = False)
    for s in sm:
        pkr.pack(s)
        pkr.pack(sm[s].alive)

    return pkr.bytes()

def Serve(config):
    log = logger.LogSender(config, 'watcher')

    sm = {}
    for s in config.Services:
        # stick our own service to on
        stickon = s['Name'] == 'watcher'
        sm[s['Key']] = StopWatch(stickon = stickon)

    rep = nng.Socket(nng.REP)
    rep.recv_timeout = 1000
    repurl = 'tcp://*:%d' % config.WatcherCmdPort
    rep.bind(repurl)

    pub = nng.Socket(nng.PUB)
    puburl = 'tcp://*:%d' % config.WatcherDatPort
    pub.bind(puburl)

    log.Send('Server started: ' + config.VersionStr +
             ', REP: ' + repurl +
             ', PUB: ' + puburl)

    try:
        while True:
            try:
                # wait for new msg
                data = rep.recv()
                # convert to service
                key = msp.unpackb(data)
                # key 0 is special
                if key == 0:
                    rep.send(PackMap(sm))
                else:
                    rep.send('')
                    # don't check for key and let it crash
                    sm[key].Pet()
            except(nng.NanoMsgAPIError):
                # ignore timeouts
                pass

            # calculate and broadcast
            for key in sm:
                if sm[key].Calculate():
                    pub.send(PackMap({ key: sm[key] }))
                    # log it
                    log.Send('%d <= (%s)' % (key, sm[key].alive), 1)
    except(KeyboardInterrupt):
        pass

    log.Send('Server stopped')

if __name__ == '__main__':

    c = Config()
    Serve(c)
