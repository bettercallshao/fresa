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
            self.__dict__ = json.loads(f.read())

        self.VersionStr = 'v%d.%d %s' % (
            self.VersionMajor,
            self.VersionMinor,
            GetGitInfo())

    def Str(self):
        return json.dumps(self.__dict__)

    def __repr__(self):
        return self.Str()

if __name__ == '__main__':
    c = Config()
    print(c)
    print(GetGitInfo())
