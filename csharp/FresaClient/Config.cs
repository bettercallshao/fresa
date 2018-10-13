using System.Text;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace FresaClient
{
    public class Config
    {
        public int CacherCmdPort = 0;
        public int CacherDatPort = 0;
        public string VersionStr = "";
        public List<Param> Params = new List<Param>();

        public static Config FromBytes(byte[] bytes)
        {
            var str = Encoding.UTF8.GetString(bytes);
            return JsonConvert.DeserializeObject<Config>(str);
        }

        public bool TryTypeCast(int key, string input, out object output)
        {
            var type = "";
            foreach (var p in Params)
            {
                if (p.Key == key)
                {
                    type = p.Type;
                    break;
                }
            }
            if (type == "i")
            {
                int i;
                if (int.TryParse(input, out i))
                {
                    output = i;
                    return true;
                }
            }
            else if (type == "b")
            {
                bool b;
                if (bool.TryParse(input, out b))
                {
                    output = b;
                    return true;
                }
            }
            else if (type == "s")
            {
                output = input;
                return true;
            }
            else if (type == "f")
            {
                double f;
                if (double.TryParse(input, out f))
                {
                    output = f;
                    return true;
                }
            }

            output = null;
            return false;
        }
    }

    public class Param
    {
        public int Key = 0;
        public string Name = "";
        public string Type = "";
        public int Denominator = 0;
    }
}
