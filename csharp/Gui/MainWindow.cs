using Gtk;
using FresaClient;
using System.Collections.Generic;
using System.Threading;

public partial class MainWindow : Gtk.Window
{
    Dictionary<string, Config> configs;
    Cacher cacher = new Cacher();
    Thread bg;
    bool alive = true;
    string addr = "";

    public MainWindow() : base(Gtk.WindowType.Toplevel)
    {
        Build();
        button2.Pressed += OnSearch;
        combobox1.Changed += OnSelect;
        button1.Pressed += OnChange;

        cacher.Changed += OnParam;

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

    protected void OnDeleteEvent(object sender, DeleteEventArgs a)
    {
        this.alive = false;
        Application.Quit();
        a.RetVal = true;
    }

    void OnSearch(object sender, object o)
    {
        configs = Greeter.Search();

        // todo: figure out how to clear the combox.
        // This has been the hardest part of csharp code, I am so glad
        // I didn't have to do gtk at work
        foreach (KeyValuePair<string, Config> entry in configs)
        {
            combobox1.PrependText(string.Format("{0}: {1}", entry.Key, entry.Value.VersionStr));
        }
    }

    void OnSelect(object sender, object o)
    {
        addr = combobox1.ActiveText.Split(':')[0];
        cacher.Connect(configs[addr], addr);
    }

    void OnChange(object sender, object o)
    {
        var key = spinbutton1.ValueAsInt;
        var value = entry1.Text;
        cacher.ChangeStr(key, value);
    }

    // run from other thread
    void OnParam(object sender, int key)
    {
        var s = "";
        foreach (Param e in configs[addr].Params)
        {
            s += string.Format("Key: {0}, Name: {1}, Type: {2}, Denominator {3}, Value: {4}\n",
                               e.Key, e.Name, e.Type, e.Denominator, cacher.Params[e.Key]);
        }

        Application.Invoke(delegate
        {
            textview1.Buffer.Text = s;
        });
    }
}
