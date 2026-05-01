export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { mode, nameA, nameB, name, category, wordsList } = req.body;

  let prompt = '';

  if (mode === 'duo') {
    // Mode duo classique : A vs B
    prompt = `Tu es le moteur d'un jeu de notoriété mondiale "Who's More Famous?".
Compare la notoriété mondiale de "${nameA}" et "${nameB}" dans la catégorie "${category}".
Évalue : présence médiatique, streams, followers, consommation mondiale, reconnaissance culturelle.
Choisis un emoji représentatif pour chacun.
Détermine une sous-catégorie précise (ex: "Rap FR", "Streetwear", "Club Paris").
Scores de 0 à 100 — PROCHES (max 12 points d'écart) pour que ce soit débattable.
Explication courte, fun et précise en français (2-3 phrases max) avec chiffres concrets.
Réponds UNIQUEMENT en JSON valide sans markdown :
{"winner":"A ou B","scoreA":number,"scoreB":number,"emojiA":"emoji","emojiB":"emoji","catA":"sous-catégorie","catB":"sous-catégorie","explanation":"explication fun"}`;

  } else if (mode === 'word') {
    // Mode mot seul : l'IA choisit un adversaire dans la liste
    const wordsStr = (wordsList || []).slice(0, 20).map(w => `${w.name} (${w.category})`).join(', ');
    prompt = `Tu es le moteur d'un jeu de notoriété mondiale "Who's More Famous?".
On t'ajoute un nouveau mot : "${name}" dans la catégorie "${category}".
Voici d'autres mots déjà dans la base : ${wordsStr || 'aucun pour l\'instant'}.
Crée 3 duos intéressants et débattables entre "${name}" et 3 adversaires différents.
Les adversaires peuvent venir de la liste ou être des éléments connus que tu choisis toi-même dans la même catégorie.
Les scores doivent être PROCHES (max 12 points d'écart).
Réponds UNIQUEMENT en JSON valide sans markdown :
{"duos":[{"nameB":"nom adversaire","emojiA":"emoji A","emojiB":"emoji B","catA":"sous-cat","catB":"sous-cat","winner":"A ou B","scoreA":number,"scoreB":number,"explanation":"explication fun 2-3 phrases"},{"nameB":"...","emojiA":"...","emojiB":"...","catA":"...","catB":"...","winner":"...","scoreA":0,"scoreB":0,"explanation":"..."},{"nameB":"...","emojiA":"...","emojiB":"...","catA":"...","catB":"...","winner":"...","scoreA":0,"scoreB":0,"explanation":"..."}]}`;
  }

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
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (!data.content || !data.content[0]) return res.status(500).json({ error: 'Réponse Claude invalide' });

    let text = data.content[0].text.trim().replace(/```json|```/g, '').trim();
    const result = JSON.parse(text);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Erreur generate-pair:', err);
    return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
}
