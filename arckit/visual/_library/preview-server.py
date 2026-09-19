#!/usr/bin/env python3
"""Local static visual preview; no business APIs."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=0)
    args=parser.parse_args()
    root=Path(__file__).resolve().parent.parent
    server=ThreadingHTTPServer(('127.0.0.1',args.port),partial(SimpleHTTPRequestHandler,directory=str(root)))
    print(f'http://127.0.0.1:{server.server_port}/_library/style-preview.html',flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
