const recapSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
    },
    recap: {
      type: "string",
    },
    highlight: {
      type: "string",
    },
    closingLine: {
      type: "string",
    },
  },
  required: [
    "title",
    "recap",
    "highlight",
    "closingLine",
  ],
  additionalProperties: false,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      distanceKm,
      elapsedTime,
      averagePace,
      questTitle,
      completedChallenges,
      checkpoints,
      photoObservation,
    } = body;

    const prompt = `
You are WildMiles, an AI outdoor adventure companion.

The runner has just completed a WildMiles run.

RUN SUMMARY

Quest:
${questTitle}

Distance:
${distanceKm} km

Time:
${elapsedTime}

Average pace:
${averagePace} per km

Completed challenges:
${JSON.stringify(completedChallenges)}

Quest checkpoints:
${JSON.stringify(checkpoints)}

Photo challenge observation:
${photoObservation || "No photo observation available."}

Write a short, fun post-run adventure recap.

RULES:

- Make it feel like an adventure, not a fitness report.
- Mention the distance and completed challenges naturally.
- If checkpoint distances are available, mention one or two.
- If a photo observation exists, include it naturally.
- Keep the recap concise.
- Do not invent locations, landmarks, weather, or events.
- Do not claim anything that is not present in the supplied data.
- Keep the tone playful and encouraging.
- Avoid generic motivational clichés.

Return structured JSON matching this schema:

${JSON.stringify(recapSchema)}
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
          format: recapSchema,

          options: {
            temperature: 0.4,
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

    const recap = JSON.parse(data.response);

    return Response.json({
      success: true,
      recap,
    });
  } catch (error) {
    console.error(
      "WildMiles recap generation error:",
      error
    );

    return Response.json(
      {
        success: false,
        error: "Failed to generate run recap",
      },
      {
        status: 500,
      }
    );
  }
}