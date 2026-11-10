/* Shadowrocket HTTPS MITM probe. */
(function () {
  const body = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>HTTPS 拦截成功</title><style>body{margin:0;padding:40px 24px;background:#f4f0e8;color:#17211d;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}main{max-width:560px;margin:auto;padding:28px;border:1px solid #d8d2c8;border-radius:16px;background:#fffdf8}h1{margin:0 0 14px;font-size:28px;color:#26704e}p{font-size:16px;line-height:1.7}code{display:block;margin-top:16px;padding:12px;background:#eee9df;border-radius:8px;word-break:break-all}</style></head>
<body><main><h1>HTTPS 解密已运行</h1><p>证书信任、HTTPS 解密和模块 HTTPS 请求脚本均正常。如果 Apple 检测仍失败，问题来自 Apple 域名的特殊连接保护。</p><code>LocShift HTTPS Probe v6</code></main></body></html>`;
  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      body
    }
  });
})();
