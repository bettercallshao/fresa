# config

import json
import git

def GetGitInfo():
    try:
        r = git.Repo('../')
        return '%s %s %s' % (r.active_branch.commit.hexsha,
                             'dirty' if r.is_dirty() else 'clean',
                             r.active_branch.name)
    except(Exception):
        return 'no git info'

class Config(object):
    def __init__(self):
        fname = '../config.json'
        with open(fname) as f:
            self._str = f.read()
            self._data = json.loads(self._str)

        self._data['VersionStr'] = 'v%d.%d %s' % (
            self._data['VersionMajor'],
            self._data['VersionMinor'],
            GetGitInfo())

    def Str(self):
        return json.dumps(self._data)

    def VersionStr(self):
        return self._data['VersionStr']

    def GreeterPort(self):
        return self._data['GreeterPort']

    def LoggerCmdPort(self):
        return self._data['LoggerCmdPort']

    def LoggerDatPort(self):
        return self._data['LoggerDatPort']

    def CacherCmdPort(self):
        # don't handle exception and let it crash
        return self._data['CacherCmdPort']

    def CacherDatPort(self):
        return self._data['CacherDatPort']

    def WatcherCmdPort(self):
        return self._data['WatcherCmdPort']

    def WatcherDatPort(self):
        return self._data['WatcherDatPort']

    def LogPath(self):
        return self._data['LogPath']

    def Params(self):
        return self._data['Params']

    def Services(self):
        return self._data['Services']

    def __repr__(self):
        return json.dumps(self._data)

if __name__ == '__main__':
    c = Config()
    print(c)
    print(GetGitInfo())