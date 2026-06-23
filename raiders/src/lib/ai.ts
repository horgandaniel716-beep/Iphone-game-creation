import type { Demon, DemonStats } from '../types';

function rollRarity(): Demon['rarity'] {
  const roll = Math.random();
  if (roll < 0.5) return 'common';
  if (roll < 0.8) return 'rare';
  if (roll < 0.95) return 'epic';
  return 'legendary';
}

function statsByRarity(rarity: Demon['rarity']): DemonStats {
  const base = { common: 1, rare: 1.4, epic: 1.8, legendary: 2.5 }[rarity];
  return {
    health: Math.floor(80 * base + Math.random() * 40),
    attack: Math.floor(15 * base + Math.random() * 10),
    defense: Math.floor(10 * base + Math.random() * 8),
    speed: Math.floor(60 * base + Math.random() * 20),
    aggroRange: Math.floor(120 + Math.random() * 80),
  };
}

export async function generateDemon(prompt: string): Promise<Demon> {
  const rarity = rollRarity();
  const stats = statsByRarity(rarity);

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Anthropic API key not set');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `You are a dark fantasy game master. Generate a unique demon guardian for a player's base.
Player's description: "${prompt}"
Rarity: ${rarity}

Respond ONLY with valid JSON matching this exact schema:
{
  "name": "string (2-3 words, menacing)",
  "lore": "string (2 sentences of dark origin story)",
  "origin": "string (name of the dimension/universe it came from)",
  "abilities": [
    {
      "name": "string",
      "description": "string (1 sentence)",
      "damage": number (10-80),
      "cooldown": number (seconds, 2-15),
      "type": "attack" | "defense" | "debuff" | "aura"
    }
  ],
  "visualTraits": {
    "primaryColor": "string (dark color)",
    "secondaryColor": "string",
    "size": "small" | "medium" | "large" | "massive",
    "features": ["array", "of", "2-4", "physical", "traits"],
    "glowColor": "string (eerie glow color)"
  }
}

Make exactly 2 abilities for common, 3 for rare, 4 for epic, 5 for legendary.
Be creative and sinister. No markdown, just the JSON object.`,
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const text = data.content[0].type === 'text' ? data.content[0].text : '';
  const parsed = JSON.parse(text);

  return {
    id: `demon_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: parsed.name,
    lore: parsed.lore,
    origin: parsed.origin,
    abilities: parsed.abilities,
    stats,
    rarity,
    visualTraits: parsed.visualTraits,
    createdAt: Date.now(),
  };
}
