using System.Text;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace FresaClient
{
    public class Util
    {
		public static Dictionary<string, dynamic> BytesToJson(byte[] bytes)
		{
			var str = Encoding.UTF8.GetString(bytes);
            var dict = JsonConvert.DeserializeObject<Dictionary<string, dynamic>>(str);
			return dict;
		}
    }
}
