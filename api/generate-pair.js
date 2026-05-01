export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { nameA, nameB, category } = req.body;
  if (!nameA || !nameB || !category) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const prompt = `Tu es le moteur d'un jeu de notoriété mondiale appelé "Who's More Famous?".
On te donne deux éléments à comparer dans la catégorie "${category}".
Élément A : "${nameA}"
Élément B : "${nameB}"

Ta mission :
1. Évalue la notoriété mondiale de chacun (présence médiatique, streams, followers, consommation mondiale, reconnaissance culturelle, etc.)
2. Choisis un emoji représentatif pour chacun
3. Détermine une sous-catégorie précise (ex: "Rap FR", "Streetwear", "Club Paris", "Réseau social")
4. Attribue un score de notoriété de 0 à 100 à chacun — les scores doivent être PROCHES (max 12 points d'écart) pour que ce soit débattable
5. Écris une explication courte, fun et précise en français (2-3 phrases max) qui justifie le résultat avec des chiffres concrets

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks :
{
  "winner": "A" ou "B",
  "scoreA": number,
  "scoreB": number,
  "emojiA": "emoji",
  "emojiB": "emoji", 
  "catA": "sous-catégorie précise",
  "catB": "sous-catégorie précise",
  "explanation": "explication fun en français"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!data.content || !data.content[0]) {
      return res.status(500).json({ error: 'Réponse Claude invalide' });
    }

    let text = data.content[0].text.trim();
    // Nettoyer si Claude a mis des backticks malgré tout
    text = text.replace(/```json|```/g, '').trim();

    const result = JSON.parse(text);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Erreur generate-pair:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
