const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

// 从环境变量读取 API 密钥（生产环境）或使用默认值（本地开发）
const API_KEY = process.env.MINIMAX_API_KEY || "";
const PORT = process.env.PORT || 3456;

const server = http.createServer((req, res) => {
  // 处理根路径 - 返回HTML页面
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    const htmlPath = path.join(__dirname, "index.html");
    fs.readFile(htmlPath, "utf8", (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("页面未找到");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  // CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // 处理AI请求
  if (req.method === "POST" && req.url === "/chat") {
    if (!API_KEY) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ success: false, error: "API密钥未配置" }));
      return;
    }

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const prompt = data.prompt || "";

        const postData = JSON.stringify({
          model: "MiniMax-Text-01",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
        });

        const options = {
          hostname: "api.minimax.chat",
          port: 443,
          path: "/v1/text/chatcompletion_v2",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + API_KEY,
          },
        };

        const apiReq = https.request(options, (apiRes) => {
          let responseData = "";
          apiRes.on("data", (chunk) => {
            responseData += chunk;
          });
          apiRes.on("end", () => {
            try {
              const result = JSON.parse(responseData);
              if (result.choices && result.choices[0]) {
                res.writeHead(200, {
                  "Content-Type": "application/json; charset=utf-8",
                });
                res.end(
                  JSON.stringify({
                    success: true,
                    text: result.choices[0].message.content,
                  }),
                );
              } else {
                throw new Error("Invalid response");
              }
            } catch (e) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: "API解析错误" }));
            }
          });
        });

        apiReq.on("error", (e) => {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "网络错误" }));
        });

        apiReq.write(postData);
        apiReq.end();
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "请求格式错误" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log("");
  console.log("==================================================");
  console.log("  薪火相传有继承 - AI案例生成器");
  console.log("==================================================");
  console.log("");
  console.log("  服务已启动！");
  console.log("  端口: " + PORT);
  console.log("  API密钥: " + (API_KEY ? "已配置" : "未配置"));
  console.log("");
  console.log("==================================================");
});
