const http = require("http");
const fs = require("fs");
const path = require("path");
const root = path.resolve(process.argv[2] || path.join(__dirname, "..")).replace(/[\\/]+$/, "");
const port = Number(process.argv[3] || 5503);
const mime = { ".html":"text/html",".js":"text/javascript",".css":"text/css",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".ico":"image/x-icon" };
http.createServer((req,res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") url = "/Views/Mobile/login.html";
  const file = path.resolve(root, url.replace(/^\//,""));
  const underRoot = file === root || file.startsWith(root + path.sep);
  if (!underRoot || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end("Not found");
  }
  res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(port, "127.0.0.1", () => {
  console.log("NBB web ready:");
  console.log("  http://127.0.0.1:" + port + "/Views/Mobile/login.html");
});
