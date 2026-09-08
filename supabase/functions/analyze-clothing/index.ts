import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Slika (imageBase64) nije poslata." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY nije podešen u secrets." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const promptText = `
    Ti si modni asistent. Analiziraj sliku odeće i vrati ISKLJUČIVO validan JSON objekat bez ikakvog dodatnog teksta ili markdown formatiranja.
    Mapiraj polja tačno na sledeće vrednosti:
    {
      "kategorija": "jedna od vrednosti: Tops, Bottoms, Shoes, Dresses, Accessories",
      "boja": "primarna boja na srpskom (npr. crna, bela, plava, crvena)",
      "stil": "jedna od vrednosti: Casual, Formalno, Sportsko, Elegantno",
      "sezona": "jedna od vrednosti: Zima, Prolece/Jesen, Leto, Sve sezone"
    }
    `;

    // Tačan model koji Google API zahteva: gemini-3.6-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return new Response(JSON.stringify({ error: data.error.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanJson = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsedData = JSON.parse(cleanJson);

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Greska u obradi:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Greska pri obradi slike." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
