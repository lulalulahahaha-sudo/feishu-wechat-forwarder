const axios = require('axios');

const CONFIG = {
  feishu: {
    appId: process.env.FEISHU_APP_ID || 'cli_a939c03d7d7a9bd4',
    appSecret: process.env.FEISHU_APP_SECRET || 'aR5BArRHv8PqhKrMkIjM8eglBg8DujuL'
  },
  wechat: {
    pushPlusToken: process.env.PUSH_PLUS_TOKEN || '84d8bf16b90a4330bd791eb406e84c56'
  }
};

async function sendToWeChat(message) {
  try {
    await axios.post('http://www.pushplus.plus/send', {
      token: CONFIG.wechat.pushPlusToken,
      title: message.title,
      content: message.content,
      template: 'markdown'
    });
  } catch (error) {
    console.error('推送失败:', error.message);
  }
}

module.exports = async (req, res) => {
  const path = req.url.split('?')[0];
  
  // 健康检查 - 支持多种路径
  if (path === '/' || path === '/health') {
    return res.status(200).json({ status: 'ok', service: '飞书微信转发' });
  }
  
  // 飞书webhook GET
  if (path === '/webhook' && req.method === 'GET') {
    const { challenge } = req.query;
    return res.status(200).json({ challenge });
  }
  
  // 飞书webhook POST
  if (path === '/webhook' && req.method === 'POST') {
    try {
      if (req.body?.header?.event_type === 'im.message.receive_v1') {
        const msg = req.body.event.message;
        let content = '';
        if (msg.message_type === 'text') {
          try { content = JSON.parse(msg.content).text || ''; } catch (e) {}
        }
        await sendToWeChat({
          title: '📢 飞书消息',
          content: content
        });
      }
      return res.status(200).json({ code: 0 });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(404).json({ error: 'Not Found' });
};