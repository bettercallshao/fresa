import socket
from config import Config
from logger import LogSender
from watcher import Petter

def Serve(config):
    petter = Petter(config, 'greeter')
    log = LogSender(config, 'greeter')

    # create udp server
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    addr = ('0.0.0.0', config.GreeterPort())
    sock.bind(addr)

    log.Send('Server started: ' + config.VersionStr() +
             ', UDP: ' + str(addr))

    try:
        while True:
            # respond to broadcast with config str
            data, addr = sock.recvfrom(4096)
            sock.sendto(config.Str().encode('utf-8'), addr)
            log.Send(str(addr), 1)
    except(KeyboardInterrupt):
        pass

    log.Send('Server stopped')
    petter.Stop()

if __name__ == '__main__':
    c = Config()
    Serve(c)
