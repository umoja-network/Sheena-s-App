
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeocodingInfo = async (lat: number, lng: number): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the location details for latitude ${lat} and longitude ${lng}. 
      Provide the result in a clean JSON format with these fields: city, province, country, full_address.
      Example: { "city": "Lenasia", "province": "Gauteng", "country": "South Africa", "full_address": "Anchorville, 1827" }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result;
  } catch (error) {
    console.error("Geocoding failed:", error);
    return null;
  }
};
