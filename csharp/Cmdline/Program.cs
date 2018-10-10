using System;
using System.Collections.Generic;
using FresaClient;

namespace Cmdline
{
    class MainClass
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("Start searching");
            var configs = Greeter.Search();
            var sel_addr = "";
            var sel_config = new Config();
            foreach (KeyValuePair<string, Config> config in configs)
            {
                Console.WriteLine("IP: " + config.Key);
                Console.WriteLine("IP: " + config.Value.VersionStr);
                sel_addr = config.Key;
                sel_config = config.Value;
            }
            Console.WriteLine("Done searching");

            var cacher = new Cacher();
            cacher.Changed += HandleCacher;
            cacher.Connect(sel_config, sel_addr);
            while (true)
            {
                cacher.Check();
            }
        }

        static void HandleCacher(object sender, int key)
        {
            var cacher = (Cacher)sender;
            if (key == 0)
            {
                Console.WriteLine("0 Key received");
            }
            else
            {
                Console.WriteLine("{0}: {1}", key, cacher.Params[key]);
            }
        }
    }
}
