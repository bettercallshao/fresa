using System;
using System.Collections.Generic;
using System.Windows.Forms;
using FresaClient;
using System.Threading;

namespace Gui
{
    public partial class Form1 : Form
    {
        Dictionary<string, Config> configs;
        Cacher cacher = new Cacher();
        Thread bg;
        bool alive = true;
        string addr = "";

        public Form1()
        {
            InitializeComponent();

            cacher.Changed += cacher_Changed;

            // thread to keep checking
            bg = new Thread(() =>
            {
                while (alive)
                {
                    cacher.Check();
                }
            });
            bg.Start();
        }

        private void Form1_FormClosed(object sender, FormClosedEventArgs e)
        {
            alive = false;
        }

        private void comboBox1_DropDown(object sender, EventArgs e)
        {
            configs = Greeter.Search();

            comboBox1.Items.Clear();
            foreach (KeyValuePair<string, Config> entry in configs)
            {
                comboBox1.Items.Add(string.Format("{0}: {1}", entry.Key, entry.Value.VersionStr));
            }
        }

        private void comboBox1_SelectedIndexChanged(object sender, EventArgs e)
        {
            addr = comboBox1.Text.Split(':')[0];
            cacher.Connect(configs[addr], addr);
        }

        private void button1_Click(object sender, EventArgs e)
        {
            var key = (int)numericUpDown1.Value;
            var value = textBox1.Text;
            cacher.ChangeStr(key, value);
        }

        // run from other thread
        void cacher_Changed(object sender, int key)
        {
            var s = "";
            foreach (Param e in configs[addr].Params)
            {
                s += string.Format("Key: {0}, Name: {1}, Type: {2}, Denominator {3}, Value: {4}\n",
                                   e.Key, e.Name, e.Type, e.Denominator, cacher.Params[e.Key]);
            }

            Invoke((MethodInvoker)(() => { richTextBox1.Text = s; }));
        }
    }
}
