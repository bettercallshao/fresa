using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;

namespace FresaClient
{
    public class Greeter
    {
		public static Dictionary<string, Dictionary<string, object>> Search()
        {
			var d = new Dictionary<string, Dictionary<string, object>>();
  
            try
            {
                var buf = new byte[1] { 0 };
                UdpClient udp = new UdpClient();

                // predefined port must match server side
                IPEndPoint broadcast = new IPEndPoint(IPAddress.Broadcast, 9000);
                udp.Send(buf, 1, broadcast);

                // try receiving as much as possible before a 0.5s timeout 
                while (true)
                {
                    IPEndPoint remote = new IPEndPoint(IPAddress.Any, 0);
                    udp.Client.ReceiveTimeout = 500;
                    byte[] r = udp.Receive(ref remote);

                    if (r.Any())
				    {
                        // there could be duplicate if broadcast reach host via mult routes
                        var ip = remote.Address.ToString();
						// parse config into map
						var config = Util.BytesToJson(r);
						d[ip] = config;
                    }
                    else
				    {
						// receive timed out
                        break;
                    }
                }
            }
			catch (Exception)
            {
            }

            return d;
        }
    }
}