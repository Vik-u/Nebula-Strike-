
import { GoogleGenAI, Type } from "@google/genai";
import { MissionData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMissionBriefing = async (level: number): Promise<MissionData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short sci-fi mission briefing for level ${level} of a space shooter game. The player uses their finger as a laser. Mention a specific type of enemy.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            briefing: { type: Type.STRING },
            objective: { type: Type.STRING }
          },
          required: ["title", "briefing", "objective"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data as MissionData;
  } catch (error) {
    console.error("Gemini failed, using fallback briefing.", error);
    return {
      title: "Operation Deep Void",
      briefing: "Anomalous signals detected in sector 7-G. Use your optical uplink to neutralize the intruders.",
      objective: "Reach 1000 points to survive."
    };
  }
};
