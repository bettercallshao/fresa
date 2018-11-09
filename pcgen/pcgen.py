import msgpack as msp
import nanomsg as nng
import urllib.request
import sys
import time
import numpy as np

def GenPointCloud(cnt):
    pts = []
    for theta in np.linspace(0, np.pi / 2, 30):
        x = 10 * np.cos(theta + cnt / 30.0)
        y = 10 * np.sin(theta + cnt / 30.0)
        for z in np.linspace(0, 10.0, 10):
            pts.append([x, y, z, z / 10, 1 - z / 10, 0.5])

    return pts, cnt + 1

def Serve(config):
    pub = nng.Socket(nng.PUB)
    puburl = 'ws://*:%d' % config['PcgenDatPort']
    pub.bind(puburl)

    cnt = 0
    while True:
        time.sleep(0.2)
        data, cnt = GenPointCloud(cnt)
        pkr = msp.Packer(autoreset = False)
        pkr.pack(data)
        pub.send(pkr.bytes())

def GetConfig(addr):
    return urllib.request.urlopen('http://' + addr + ':8999/fresa/config').read()

if __name__ == '__main__':

    if (len(sys.argv) != 2):
        print('Usage: ' + sys.argv[0] + ' <addr>')
        exit(-1)

    #c = GetConfig(sys.argv[1])
    Serve({'PcgenDatPort': 9200})
