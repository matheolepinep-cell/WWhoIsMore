export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { itemA, itemB } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Compare la notoriété mondiale de "${itemA}" et "${itemB}". Réponds UNIQUEMENT en JSON valide sans markdown : {"winner":"A ou B","scoreA":number,"scoreB":number,"explanation":"2-3 phrases fun en français","emojiA":"emoji","emojiB":"emoji","catA":"catégorie courte","catB":"catégorie courte"}. Les scores doivent être proches (max 10 points d'écart).`
      }]
    })
  });

  const data = await response.json();
  try {
    const result = JSON.parse(data.content[0].text);
    res.status(200).json(result);
  } catch {
    res.status(500).json({ error: 'Erreur parsing', raw: data.content[0].text });
  }
}
