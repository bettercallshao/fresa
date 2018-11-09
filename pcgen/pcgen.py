import msgpack as msp
import nanomsg as nng
import urllib.request
import sys

def PackMap(pm):
    pkr = msp.Packer(autoreset = False)
    for key in pm:
        pkr.pack(key)
        pkr.pack(pm[key])
    return pkr.bytes()

def UnpackValue(pm, key, upk):
    value = upk.unpack()
    if pm[key] == value:
        return False
    else:
        pm[key] = value
        return True

def Notify(pm, key, pub, log):
    pub.send(PackMap({ key: pm[key] }))
    log.Send('%d <= (%s)' % (key, str(pm[key])), 1)

def Serve(config):
    petter = Petter(config, 'cacher')
    log = LogSender(config, 'cacher')

    # create param map
    pm = {}
    for p in config.Params:
        pm[p['Key']] = None

    sm = {}
    for s in config.Series:
        sm[s['Key']] = s['Serie']

    rep = nng.Socket(nng.REP)
    repurl = 'tcp://*:%d' % config.CacherCmdPort
    rep.bind(repurl)

    pub = nng.Socket(nng.PUB)
    puburl = 'tcp://*:%d' % config.CacherDatPort
    pub.bind(puburl)

    log.Send('Server started: ' + config.VersionStr +
             ', REP: ' + repurl +
             ', PUB: ' + puburl)

    try:
        while True:
            # prepare a stream unpacker
            upk = msp.Unpacker()
            # wait for new msg
            upk.feed(rep.recv())
            # find key
            key = upk.unpack()
            if key == 0:
                # key 0 is special
                rep.send(PackMap(pm))
            elif key < 0:
                # series
                rep.send('')
                serie = sm[key]
                for paramKey in serie:
                    print(paramKey)
                    if UnpackValue(pm, paramKey, upk):
                        Notify(pm, paramKey, pub, log)
            else:
                # one param
                rep.send('')
                if UnpackValue(pm, key, upk):
                    Notify(pm, key, pub, log)

    except(KeyboardInterrupt):
        pass

    petter.Stop()
    log.Send('Server stopped')

def GetConfig(addr):
    return urllib.request.urlopen('http://' + addr + ':8999/fresa/config').read()

if __name__ == '__main__':

    if (len(sys.argv) != 2):
        print('Usage: ' + sys.argv[0] + ' <addr>')
        exit(-1)

    c = GetConfig(sys.argv[1])
