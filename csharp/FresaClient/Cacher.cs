using System;
using System.Collections.Generic;
using NNanomsg;
using NNanomsg.Protocols;
using MessagePack;

namespace FresaClient
{
    public class Cacher
    {
		public Dictionary<int, object> Params = new Dictionary<int, object>();
		public event EventHandler<int> Changed = delegate { };

		RequestSocket req = new RequestSocket();
		SubscribeSocket sub = new SubscribeSocket();

		public void Connect(Dictionary<string, object> config, string addr)
		{
			req.Connect(String.Format("tcp://{0}:{1}", addr, config["CacherCmdPort"]));
			sub.Connect(String.Format("tcp://{0}:{1}", addr, config["CacherDatPort"]));
            NN.SetSockOpt(sub.SocketID, SocketOption.RCVTIMEO, 100);
			sub.Subscribe("");

			Params.Clear();
			req.Send(PackOne(0, 0));
            // this is blocking, we won't return until server has responded
			var data = req.Receive();
            UnpackToMap(data, ref Params);
            // use key 0 to signal everything has changed
            // Alternatively, a event could be emitted for each key but the
            // consideration is it could overload whatever handler for being
            // called too many times. It is conceivable the handle simply will
            // update for all params each time a event is received.
			Changed(this, 0);
		}

        public void Change(int key, object value)
		{
			req.Send(PackOne(key, value));
		}

        public void Check()
		{
			var data = sub.Receive();
            // data is null when timed out
			if (data != null)
			{
				var list = UnpackToMap(data, ref Params);
				// broadcast for each key changed (expect a single item in the list)
				foreach (var key in list) {
					Changed(this, key);
				}
			}
		}

        static byte[] PackOne(int key, object value)
		{
			var stream = new System.IO.MemoryStream();
			MessagePackSerializer.Serialize(stream, key);
            MessagePackSerializer.Serialize(stream, value);
			return stream.ToArray();
		}

		static List<int> UnpackToMap(byte[] data, ref Dictionary<int, object> map)
		{
			var list = new List<int>();
			var stream = new System.IO.MemoryStream();
			var total = data.Length;
			stream.Write(data, 0, total);
			stream.Position = 0;
			while (stream.Position < total)
			{
				// expected format (per design):
				// int (key), obj (value), int (key, obj (value), ...
				var key = MessagePackSerializer.Deserialize<int>(stream, true);
				var value = MessagePackSerializer.Deserialize<object>(stream, true);
				map[key] = value;
				list.Add(key);
			}
			return list;
		}
    }
}
