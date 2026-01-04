const https = require("https");

const API_KEY = process.env.MINIMAX_API_KEY;

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      res.status(400).json({ success: false, error: "提示词不能为空" });
      return;
    }

    const postData = JSON.stringify({
      model: "MiniMax-Text-01",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    const result = await new Promise((resolve, reject) => {
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
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(new Error("API解析错误"));
          }
        });
      });

      apiReq.on("error", reject);
      apiReq.write(postData);
      apiReq.end();
    });

    if (result.choices && result.choices[0]) {
      res.status(200).json({
        success: true,
        text: result.choices[0].message.content,
      });
    } else {
      res.status(500).json({ success: false, error: "API响应格式错误" });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || "服务器错误" });
  }
};
