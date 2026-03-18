// NaForce API - AI 文章生成

export default async function handler(req, res) {
  // 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, apiKey, model } = req.body;

  if (!title || !apiKey) {
    return res.status(400).json({ error: '缺少 title 或 apiKey' });
  }

  // 根据选择的模型调用不同的 API
  const modelConfig = {
    'deepseek': {
      url: 'https://api.deepseek.com/v1/chat/completions',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: { model: 'deepseek-chat', messages: [{ role: 'user', content: `请根据以下标题写一篇结构清晰、内容丰富的文章：${title}` }], temperature: 0.7 }
    },
    'openai': {
      url: 'https://api.openai.com/v1/chat/completions',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: { model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: `请根据以下标题写一篇结构清晰、内容丰富的文章：${title}` }], temperature: 0.7 }
    },
    'anthropic': {
      url: 'https://api.anthropic.com/v1/messages',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: { model: 'claude-3-haiku-20240307', max_tokens: 4000, messages: [{ role: 'user', content: `请根据以下标题写一篇结构清晰、内容丰富的文章：${title}` }] }
    }
  };

  const config = modelConfig[model || 'deepseek'];
  if (!config) {
    return res.status(400).json({ error: '不支持的模型' });
  }

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: JSON.stringify(config.body)
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    // 提取生成的文本
    let content = '';
    if (data.choices && data.choices[0]) {
      content = data.choices[0].message.content;
    } else if (data.content) {
      content = data.content[0].text;
    }

    res.status(200).json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
