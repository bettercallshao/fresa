import socket
from config import Config
from forgetter import Petter

def Serve():
    config = Config()

    # keep petting the forgetter
    petter = Petter(config, 'greeter')

    # create udp server
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(('0.0.0.0', config.GreeterPort()))

    try:
        while True:
            # respond to broadcast with config str
            data, addr = sock.recvfrom(4096)
            sock.sendto(bytes(config.Str(), 'utf-8'), addr)
    except(KeyboardInterrupt):
        pass

    petter.Stop()

if __name__ == '__main__':
    Serve()
