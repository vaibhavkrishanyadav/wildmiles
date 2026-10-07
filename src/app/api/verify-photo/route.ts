const verificationSchema = {
  type: "object",
  properties: {
    verified: {
      type: "boolean",
    },
    confidence: {
      type: "number",
    },
    reason: {
      type: "string",
    },
    observation: {
      type: "string",
    },
  },
  required: [
    "verified",
    "confidence",
    "reason",
    "observation",
  ],
  additionalProperties: false,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const challenge = body.challenge;
    const image = body.image;

    if (!challenge || !image) {
      return Response.json(
        {
          success: false,
          error: "Challenge and image are required",
        },
        {
          status: 400,
        }
      );
    }

    // Browser sends:
    // data:image/jpeg;base64,/9j/4AAQ...
    //
    // Ollama only needs the base64 portion.
    const base64Image = image.includes(",")
      ? image.split(",")[1]
      : image;

    const prompt = `
You are the photo verification engine for WildMiles.

The runner was given this outdoor challenge:

"${challenge}"

Analyze the supplied image and determine whether
it reasonably satisfies the challenge.

RULES:

- Be fair, but do not approve obviously unrelated images.
- Only verify what is actually visible in the image.
- Do not infer things that cannot be seen.
- A photo does not need to be perfect.
- If the challenge asks for an object, that object should
  clearly be visible.
- confidence must be between 0 and 1.
- Keep reason concise.
- observation should contain one short interesting
  observation about the image.

Set verified=true only when the image reasonably
satisfies the challenge.
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
          images: [base64Image],
          stream: false,
          format: verificationSchema,
          options: {
            temperature: 0,
          },
        }),
      }
    );

    if (!ollamaResponse.ok) {
      throw new Error(
        `Ollama verification failed: ${ollamaResponse.status}`
      );
    }

    const data = await ollamaResponse.json();

    const verification = JSON.parse(data.response);

    return Response.json({
      success: true,
      verification,
    });
  } catch (error) {
    console.error(
      "WildMiles photo verification error:",
      error
    );

    return Response.json(
      {
        success: false,
        error: "Failed to verify photo",
      },
      {
        status: 500,
      }
    );
  }
}