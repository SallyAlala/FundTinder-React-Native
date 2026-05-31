// 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

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';

const openAiKey = defineSecret('OPENAI_API_KEY');

export const generateThemes = onRequest(
  {
    secrets: [openAiKey],
    cors: true,
  },
  async (request, response) => {
    try {
      const { description } = request.body;

      if (!description || typeof description !== 'string') {
        response.status(400).json({
          error: 'Description is required.',
        });

        return;
      }

      const client = new OpenAI({
        apiKey: openAiKey.value(),
      });

      const result = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `
                You are analyzing startup and investor profiles for FundTinder.
                
                FundTinder is a platform that connects entrepreneurs, startup founders and investors.
                
                Your task is to identify the most relevant business, industry, technology and investment themes from a profile description.
                
                The generated themes will be used by users to discover and filter profiles they are interested in.
                
                Rules:
                - Return between 1 and 3 themes.
                - Themes should be short (1-3 words).
                - Themes should be useful for discovery and filtering.
                - Themes may represent industries, technologies, business models or market segments.
                - Use commonly understandable names.
                - The platform uses themes for profile filtering and discovery.
                - Consistency is more important than creativity.
                - When multiple theme names could describe the same concept, prefer the most common and broadly recognized term.
                - Reuse established themes whenever possible instead of inventing new variations.
                - Avoid generic themes such as "Business", "Company", "Startup", "Innovation".
                - If the profile is written in Hungarian, return themes in English.
                - Do not explain your reasoning.
                - Return ONLY valid JSON.
                
                Response format:
                
                {
                  "themes": [
                    "Theme 1",
                    "Theme 2"
                  ]
                }
                            `,
          },
          {
            role: 'user',
            content: `
              Analyze this FundTinder profile and generate the most relevant themes.
              
              Profile description:
              
              ${description}
               `,
          },
        ],
        response_format: {
          type: 'json_object',
        },
      });

      response.json({
        result: JSON.parse(
          result.choices[0].message.content ?? '{"themes":[]}',
        ),
      });
    } catch (error) {
      console.error(error);

      response.status(500).json({
        error: String(error),
      });
    }
  },
);

export const askLili = onRequest(
  {
    secrets: [openAiKey],
    cors: true,
  },
  async (request, response) => {
    try {
      const client = new OpenAI({
        apiKey: openAiKey.value(),
      });

      const { messages } = request.body;

      const result = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `
              You are Lili AI, the virtual assistant of FundTinder.
              
              FundTinder is a platform that connects investors and masterminds.
              
              Your responsibilities:
              - Help users navigate the application.
              - Explain where features can be found.
              - Explain filtering, chats, profile editing and themes.
              - Help users improve their profiles.
              - Provide basic startup and fundraising guidance.
              - Keep answers practical and concise.
              
              Application features:
              - Browse: discover founders and investors.
              - Filters: filter users by city, themes and budget range.
              - Chats: communicate with other users.
              - Profile: edit your profile, description, budget and profile picture.
              - Themes are automatically generated from profile descriptions and are used for discovery.
              
              Always answer in the language used by the user.
              Always answer as Lili AI.
              `,
          },
          ...messages,
        ],
      });

      response.json({
        answer: result.choices[0].message.content,
      });
    } catch (error) {
      console.error(error);
      response.status(500).json(error);
    }
  },
);
