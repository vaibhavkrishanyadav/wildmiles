const questSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },

    summary: {
      type: "string",
    },

    warmup: {
      type: "string",
    },

    movementChallenge: {
      type: "object",
      properties: {
        title: {
          type: "string",
        },
        instruction: {
          type: "string",
        },
      },
      required: ["title", "instruction"],
      additionalProperties: false,
    },

    explorationChallenge: {
      type: "object",
      properties: {
        title: {
          type: "string",
        },
        instruction: {
          type: "string",
        },
      },
      required: ["title", "instruction"],
      additionalProperties: false,
    },

    photoChallenge: {
      type: "object",
      properties: {
        title: {
          type: "string",
        },
        instruction: {
          type: "string",
        },
      },
      required: ["title", "instruction"],
      additionalProperties: false,
    },

    finishChallenge: {
      type: "object",
      properties: {
        title: {
          type: "string",
        },
        instruction: {
          type: "string",
        },
      },
      required: ["title", "instruction"],
      additionalProperties: false,
    },
  },

  required: [
    "title",
    "summary",
    "warmup",
    "movementChallenge",
    "explorationChallenge",
    "photoChallenge",
    "finishChallenge",
  ],

  additionalProperties: false,
};

const XP = {
  movement: 50,
  exploration: 75,
  photo: 50,
  finish: 75,
  completionBonus: 100,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const duration = body.duration ?? 30;
    const difficulty = body.difficulty ?? "easy";
    const mode = body.mode ?? "exploration";

    const prompt = `
You are WildMiles, an AI adventure designer for runners.

Your goal is to get the user away from their screen
and exploring the real world.

Create one outdoor running adventure.

USER PREFERENCES

Duration: ${duration} minutes
Difficulty: ${difficulty}
Mode: ${mode}

RULES

1. Create exactly one movement challenge.
2. Create exactly one exploration challenge.
3. Create exactly one photo challenge.
4. Create exactly one finishing challenge.

The photo challenge must ask the runner to photograph
something that can reasonably be verified from an image.

Good examples:
- something yellow in nature
- an interesting tree
- a flower
- something naturally symmetrical
- an unusual outdoor object

Bad examples:
- photograph a stranger
- enter private property
- photograph someone's house
- go onto dangerous roads

Keep every instruction short.

Do not calculate XP.
Do not include XP in your response.

Never instruct the user to:
- trespass
- enter private property
- cross unsafe roads
- interact with strangers
- perform dangerous exercises

Return data matching this JSON schema:

${JSON.stringify(questSchema)}
`;

    const ollamaResponse = await fetch(
      "http://localhost:11434/api/generate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model: "gemma3:4b",
          prompt,
          stream: false,

          format: questSchema,

          options: {
            temperature: 0,
          },
        }),
      }
    );

    if (!ollamaResponse.ok) {
      throw new Error(
        `Ollama returned ${ollamaResponse.status}`
      );
    }

    const data = await ollamaResponse.json();

    const generatedQuest = JSON.parse(data.response);

    const quest = {
      title: generatedQuest.title,
      summary: generatedQuest.summary,
      warmup: generatedQuest.warmup,

      challenges: {
        movement: {
          ...generatedQuest.movementChallenge,
          type: "movement",
          requiresPhoto: false,
          xp: XP.movement,
        },

        exploration: {
          ...generatedQuest.explorationChallenge,
          type: "exploration",
          requiresPhoto: false,
          xp: XP.exploration,
        },

        photo: {
          ...generatedQuest.photoChallenge,
          type: "photo",
          requiresPhoto: true,
          xp: XP.photo,
        },

        finish: {
          ...generatedQuest.finishChallenge,
          type: "finish",
          requiresPhoto: false,
          xp: XP.finish,
        },
      },

      completionBonus: XP.completionBonus,

      totalXp:
        XP.movement +
        XP.exploration +
        XP.photo +
        XP.finish +
        XP.completionBonus,

      settings: {
        duration,
        difficulty,
        mode,
      },
    };

    return Response.json({
      success: true,
      quest,
    });
  } catch (error) {
    console.error("WildMiles quest generation error:", error);

    return Response.json(
      {
        success: false,
        error: "Failed to generate WildMiles quest",
      },
      {
        status: 500,
      }
    );
  }
}