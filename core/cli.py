from config import Config
from logger import LogSender
from threading import Thread
import fire
import json
import psutil
import signal
import socket
import time
import msgpack as msp
import nanomsg as nng

class Cli(object):
    def __init__(self):
        self.stop = False
        self.config = Config()

    def Start(self):
        start = lambda script: psutil.Popen(['python', script], close_fds=True)
        start('logger.py')
        time.sleep(0.1)
        start('watcher.py')
        start('greeter.py')
        start('cacher.py')

    def Stop(self):
        stop = lambda script: [p.send_signal(signal.SIGINT) for p in psutil.process_iter() if tuple(p.cmdline()) == ('python', script)]
        stop('cacher.py')
        stop('greeter.py')
        stop('watcher.py')
        time.sleep(5)
        stop('logger.py')

    def Greeter(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(1.0)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        # broadcast with empty message
        sent = sock.sendto(b'', ('<broadcast>', self.config.GreeterPort))
        while True:
            try:
                data, server = sock.recvfrom(4096)
                c = json.loads(data)
                print('%s: %s: %s' % (server[0], c['DeviceType'], c['VersionStr']))
            except(socket.timeout):
                break

    def CacherSend(self, array):
        sub = nng.Socket(nng.SUB)
        sub.recv_timeout = 1000
        sub.set_string_option(nng.SUB, nng.SUB_SUBSCRIBE, '')
        sub.connect('tcp://localhost:%d' % self.config.CacherDatPort)
        time.sleep(0.1)

        req = nng.Socket(nng.REQ)
        req.connect('tcp://localhost:%d' % self.config.CacherCmdPort)
        pkr = msp.Packer(autoreset = False)
        for a in array:
            pkr.pack(a)
        req.send(pkr.bytes())
        got = req.recv()
        if got:
            upk = msp.Unpacker()
            upk.feed(got)
            print([a for a in upk])

        try:
            data = sub.recv()
            upk = msp.Unpacker()
            upk.feed(data)
            print('Cacher: ' + str([a for a in upk]))
        except(nng.NanoMsgAPIError):
            pass

    def WatcherSend(self, key):
        sub = nng.Socket(nng.SUB)
        sub.recv_timeout = 1000
        sub.set_string_option(nng.SUB, nng.SUB_SUBSCRIBE, '')
        sub.connect('tcp://localhost:%d' % self.config.WatcherDatPort)
        time.sleep(0.1)

        req = nng.Socket(nng.REQ)
        req.connect('tcp://localhost:%d' % self.config.WatcherCmdPort)
        data = msp.packb(key)
        req.send(data)
        got = req.recv()
        if got:
            upk = msp.Unpacker()
            upk.feed(got)
            print([a for a in upk])

        try:
            data = sub.recv()
            upk = msp.Unpacker()
            upk.feed(data)
            print('Watcher: ' + str([a for a in upk]))
        except(nng.NanoMsgAPIError):
            pass

    def LoggerSend(self, prefix, verblevel, data):
        sub = nng.Socket(nng.SUB)
        sub.recv_timeout = 1000
        sub.set_string_option(nng.SUB, nng.SUB_SUBSCRIBE, '')
        sub.connect('tcp://localhost:%d' % self.config.LoggerDatPort)
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
