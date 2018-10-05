from config import Config
from logger import LogSender
from watcher import Petter
import msgpack as msp
import nanomsg as nng

class Param(object):
    def __init__(self, mspdata = None, defi = None):
        if mspdata:
            # make the two independant object an array for easier parsing
            self._data = msp.unpackb(b'\x92' + mspdata)
        elif defi:
            self._data = [defi['Key'], None]
        else:
            self._data = [None, None]

    def Key(self):
        return self._data[0]

    def Value(self):
        return self._data[1]

    def From(self, other):
        # ignore key when comparing, assume they match
        if self._data[1] != other._data[1]:
            self._data[1] = other._data[1]
            return True
        else:
            return False

    def Pack(self):
        return msp.packb(self._data)[1:]

def Serve(config):
    petter = Petter(config, 'cacher')
    log = LogSender(config, 'cacher')

    # create param map
    pm = {}
    for p in config.Params():
        pm[p['Key']] = Param(defi = p)

    rep = nng.Socket(nng.REP)
    repurl = 'tcp://*:%d' % config.CacherCmdPort()
    rep.bind(repurl)

    pub = nng.Socket(nng.PUB)
    puburl = 'tcp://*:%d' % config.CacherDatPort()
    pub.bind(puburl)

    log.Send('Server started: ' + config.VersionStr() +
             ', REP: ' + repurl +
             ', PUB: ' + puburl)

    try:
        while True:
            # wait for new msg
            data = rep.recv()
            # convert to param value
            value = Param(mspdata = data)
            # key 0 is special
            if value.Key() == 0:
                # pack everything back to back
                out = b''.join([pm[p].Pack() for p in pm])
                rep.send(out)
            else:
                rep.send('')
                # don't check for key and let it crash
                if pm[value.Key()].From(value):
                    # publish change
                    pub.send(data)
                    # log it
                    log.Send('%d <= (%s)' % (value.Key(), str(value.Value())), 1)
    except(KeyboardInterrupt):
        pass

    log.Send('Server stopped')
    petter.Stop()

def Test():
    data = b'\x01\x02'
    value = Param(mspdata = data)
    assert(value.Pack() == data)

if __name__ == '__main__':

    # always run this simple test
    Test()

    c = Config()
    Serve(c)
