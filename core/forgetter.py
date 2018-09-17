from config import Config
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
    for s in config.Services():
        if s['Name'] == name:
            data = msp.packb(s['Key'])
    # can't continue without an entry in config
    if not data:
        return

    # keep petting for ever
    req = nng.Socket(nng.REQ)
    req.send_timeout = 100
    req.recv_timeout = 400
    req.connect('tcp://localhost:%d' % config.ForgetterCmdPort())
    while self.alive:
        time.sleep(2.5)
        req.send(data)
        try:
            req.recv()
        except(nng.NanoMsgAPIError):
            pass

# global service map
g_sm = {}

class Service(object):
    def __init__(self, mspdata = None, defi = None, stickon = False):
        if mspdata:
            self._key = msp.unpackb(mspdata)
        elif defi:
            self._key = defi['Key']
        else:
            self._key = None
        self._timestamp = datetime.now()
        self._alive = True
        self._stickon = stickon

    def Key(self):
        return self._key

    def Pet(self):
        self._timestamp = datetime.now()

    def Calculate(self):
        if self._stickon:
            return False
        else:
            now = datetime.now()
            delta = now - self._timestamp
            alive = delta.total_seconds() < 5
            if self._alive != alive:
                self._alive = alive
                return True
            else:
                return False

    def Pack(self):
        return msp.packb([self._key, self._alive])[1:]

def InitServiceMap(config):
    for s in config.Services():
        # stick our own service to on
        stickon = s['Name'] == 'forgetter'
        g_sm[s['Key']] = Service(defi = s, stickon = stickon)

def PackServices():
    # pack everything back to back
    return b''.join([g_sm[s].Pack() for s in g_sm])

def Serve(config):
    rep = nng.Socket(nng.REP)
    rep.recv_timeout = 1000
    rep.bind('tcp://*:%d' % config.ForgetterCmdPort())

    pub = nng.Socket(nng.PUB)
    pub.bind('tcp://*:%d' % config.ForgetterDatPort())

    try:
        while True:
            try:
                # wait for new msg
                data = rep.recv()
                # convert to service
                value = Service(mspdata = data)
                # key 0 is special
                if value.Key() == 0:
                    rep.send(PackServices())
                else:
                    rep.send('')
                    # don't check for key and let it crash
                    g_sm[value.Key()].Pet()
            except(nng.NanoMsgAPIError):
                # ignore timeouts
                pass

            # calculate and broadcast
            for s in g_sm:
                if g_sm[s].Calculate():
                    pub.send(g_sm[s].Pack())
    except(KeyboardInterrupt):
        pass

if __name__ == '__main__':

    c = Config()
    InitServiceMap(c)
    Serve(c)
