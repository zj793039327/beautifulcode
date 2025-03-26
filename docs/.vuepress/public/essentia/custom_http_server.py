from http.server import HTTPServer, SimpleHTTPRequestHandler

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加 COOP 和 COEP 头
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()

# 运行服务器，监听 8000 端口
PORT = 8000
httpd = HTTPServer(("0.0.0.0", PORT), CustomHandler)
print(f"Serving on port {PORT}")
httpd.serve_forever()
