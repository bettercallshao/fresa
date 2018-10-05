from config import Config
from logger import LogSender
from threading import Thread
import fire
import json
import socket
import time
import msgpack as msp
import nanomsg as nng

class Cli(object):
    def __init__(self):
        self.stop = False
        self.config = Config()

    def Greeter(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(1.0)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        # broadcast with empty message
        sent = sock.sendto(b'', ('<broadcast>', self.config.GreeterPort()))
        while True:
            try:
                data, server = sock.recvfrom(4096)
                c = json.loads(data)
                print('%s: %s: %s' % (server[0], c['DeviceType'], c['VersionStr']))
            except(socket.timeout):
                break

    def CacherSend(self, key, value):
        sub = nng.Socket(nng.SUB)
        sub.recv_timeout = 1000
        sub.set_string_option(nng.SUB, nng.SUB_SUBSCRIBE, '')
        sub.connect('tcp://localhost:%d' % self.config.CacherDatPort())
        time.sleep(0.1)

        req = nng.Socket(nng.REQ)
        req.connect('tcp://localhost:%d' % self.config.CacherCmdPort())
        data = msp.packb([key, value])[1:]
        req.send(data)
        got = req.recv()
        if got:
            # this is a little hacky, make the parser think it's a list
            print(msp.unpackb(bytes([len(got) + 0x90]) + got))

        try:
            data = sub.recv()
            print('Cacher: ', msp.unpackb(b'\x92' + data))
        except(nng.NanoMsgAPIError):
            pass

    def WatcherSend(self, key):
        sub = nng.Socket(nng.SUB)
        sub.recv_timeout = 1000
        sub.set_string_option(nng.SUB, nng.SUB_SUBSCRIBE, '')
        sub.connect('tcp://localhost:%d' % self.config.WatcherDatPort())
        time.sleep(0.1)

        req = nng.Socket(nng.REQ)
        req.connect('tcp://localhost:%d' % self.config.WatcherCmdPort())
        data = msp.packb(key)
        req.send(data)
        got = req.recv()
        if got:
            # this is a little hacky, make the parser think it's a list
            print(msp.unpackb(bytes([len(got) + 0x90]) + got))

        try:
            data = sub.recv()
            print('Watcher: ', msp.unpackb(b'\x92' + data))
        except(nng.NanoMsgAPIError):
            pass

    def LoggerSend(self, prefix, verblevel, data):
        sub = nng.Socket(nng.SUB)
        sub.recv_timeout = 1000
        sub.set_string_option(nng.SUB, nng.SUB_SUBSCRIBE, '')
        sub.connect('tcp://localhost:%d' % self.config.LoggerDatPort())
        time.sleep(0.1)

        ls = LogSender(self.config, prefix)
        ls.Send(data, verblevel = verblevel)

        try:
            data = sub.recv()
            print('Logger: ' + str(data))
        except(nng.NanoMsgAPIError):
            pass

if __name__ == '__main__':
    fire.Fire(Cli)
