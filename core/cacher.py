from config import Config
from forgetter import Petter
import msgpack as msp
import nanomsg as nng

# global param map
g_pm = {}

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

    def From(self, other):
        # ignore key when comparing, assume they match
        if self._data[1] != other._data[1]:
            self._data[1] = other._data[1]
            return True
        else:
            return False

    def Pack(self):
        return msp.packb(self._data)[1:]

def InitParamMap(config):
    for p in config.Params():
        g_pm[p['Key']] = Param(defi = p)

def PackParams():
    # pack everything back to back
    return b''.join([g_pm[p].Pack() for p in g_pm])

def Serve(config):
    petter = Petter(config, 'cacher')

    rep = nng.Socket(nng.REP)
    rep.bind('tcp://*:%d' % config.CacherCmdPort())

    pub = nng.Socket(nng.PUB)
    pub.bind('tcp://*:%d' % config.CacherDatPort())

    try:
        while True:
            # wait for new msg
            data = rep.recv()
            # convert to param value
            value = Param(mspdata = data)
            # key 0 is special
            if value.Key() == 0:
                rep.send(PackParams())
            else:
                rep.send('')
                # don't check for key and let it crash
                if g_pm[value.Key()].From(value):
                    # publish change
                    pub.send(data)
    except(KeyboardInterrupt):
        pass

    petter.Stop()

def Test():
    data = b'\x01\x02'
    value = Param(mspdata = data)
    assert(value.Pack() == data)

if __name__ == '__main__':

    # always run this simple test
    Test()

    c = Config()
    InitParamMap(c)
    Serve(c)
