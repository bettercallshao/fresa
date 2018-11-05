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
        Config config = new Config();

        public Cacher()
        {
            NN.SetSockOpt(sub.SocketID, SocketOption.RCVTIMEO, 100);
            sub.Subscribe("");
        }

        public void Connect(Config config, string addr)
        {
            req.Connect(String.Format("ws://{0}:{1}", addr, config.CacherCmdPort));
            sub.Connect(String.Format("ws://{0}:{1}", addr, config.CacherDatPort));
            this.config = config;

            Params.Clear();
            req.Send(PackOne(0, 0));
            // this is blocking, we won't return until server has responded
            var data = req.Receive();
            UnpackToMap(data, config.Params, ref Params);
            // use key 0 to signal everything has changed
            // Alternatively, a event could be emitted for each key but the
            // consideration is it could overload whatever handler for being
            // called too many times. It is conceivable the handle simply will
            // update for all params each time a event is received.
            Changed(this, 0);
        }

        public void ChangeRaw(int key, object value)
        {
            req.Send(PackOne(key, value));
        }

        public bool ChangeStr(int key, string str)
        {
            object value;
            if (config.TryTypeCast(key, str, out value))
            {
                ChangeRaw(key, value);
                return true;
            }
            else
            {
                return false;
            }
        }

        public void Check()
        {
            var data = sub.Receive();
            // data is null when timed out
            if (data != null)
            {
                var list = UnpackToMap(data, this.config.Params, ref Params);
                // broadcast for each key changed (expect a single item in the list)
                foreach (var key in list) {
                    Changed(this, key);
                }
            }
        }

        static byte[] PackOne(int key, object value)
        {
            var list = new List<object>{ key, value };
            var stream = new System.IO.MemoryStream();
            MessagePackSerializer.Serialize(stream, list);
            return stream.ToArray();
        }

        static List<int> UnpackToMap(byte[] data, List<Param> cfgs, ref Dictionary<int, object> map)
        {
            var stream = new System.IO.MemoryStream();
            var total = data.Length;
            stream.Write(data, 0, total);
            stream.Position = 0;
            var list = MessagePackSerializer.Deserialize<List<object>>(stream, true);
            var key = (int)list[0];
            if (key == 0) {
                var ret = new List<int>();
                for (int i = 0; i < cfgs.Count; ++i) {
                    map[cfgs[i].Key] = list[i + 1];
                    ret.Add(cfgs[i].Key);
                }
                return ret;
            } else {
                map[key] = list[1];
                return new List<int> { key };
            }
        }
    }
}
