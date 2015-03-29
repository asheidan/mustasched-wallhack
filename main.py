import tornado.httpserver
import tornado.ioloop
import tornado.web

from tornado.escape import url_escape

import os
import re

BASE_DIR = os.path.dirname(__file__)
PICT_DIR = os.path.abspath(
    os.path.expanduser("~/Pictures/"),
)
STAT_DIR = BASE_DIR


def json(o):
    return o.__json__()


class Image:
    def __init__(self, filename, root):
        self.filename = filename
        self.root = root

    @property
    def url(self):
        return "/slide" + os.path.join(self.root, self.filename)

    def to_json(self):
        return {"name": self.filename,
                "url": self.url,
                }


class ListHandler(tornado.web.RequestHandler):
    def list_directory(self, path):
        path = re.sub(r"^/", "", path)
        root_dir = os.path.join(PICT_DIR, path)
        if not os.path.isdir(root_dir):
            self.send_error(status_code=404)
            return

        response = {}
        for root, dirs, files in os.walk(root_dir, topdown=True):
            dirs.sort()
            files.sort()
            relative_root = re.sub(PICT_DIR, "", root)
            response["root"] = relative_root
            response["dirs"] = list(dirs)
            response["files"] = [Image(f, relative_root).to_json() for f in files if not f.startswith(".")]

            # Prevent recursive exploration
            del dirs[:]

        return response


    def get(self, path):
        response = self.list_directory(path)
        if response is not None:
            self.write(response)

routes = [(r"/()", tornado.web.StaticFileHandler, {"path": "html/index.html"}),
          (r"/static/(.*)", tornado.web.StaticFileHandler, {"path": STAT_DIR}),
          (r"/list/(.*)", ListHandler),
          (r"/slide/(.*)", tornado.web.StaticFileHandler, {"path": PICT_DIR}),
          ]

application = tornado.web.Application(routes, debug=True,
                                      )

if "__main__" == __name__:
    ssl_options = {
        "certfile": os.path.join(BASE_DIR, "server.crt"),
        "keyfile": os.path.join(BASE_DIR, "server.key"),
    }
    http_server = tornado.httpserver.HTTPServer(
        application, ssl_options=ssl_options
    )
    http_server.listen(4443)
    tornado.ioloop.IOLoop.instance().start()
