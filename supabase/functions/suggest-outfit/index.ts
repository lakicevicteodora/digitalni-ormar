import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items, prilika, vreme } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Nema dostupne odeće u ormanu za kreiranje kombinacije.",
        }),
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

    const wardrobeList = items.map((item: any) => ({
      id: item.id,
      naziv: item.naziv,
      kategorija: item.kategorija,
      boja: item.boja || "nepoznata",
      stil: item.stil || "casual",
      sezona: item.sezona || "sve sezone",
    }));

    const promptText = `
    Ti si lični modni stilista. Tvoj zadatak je da sastaviš najbolji mogući autfit od ponuđenih komada odeće iz baze.
    
    Kontekst za autfit:
    - Prilika: ${prilika || "svakodnevni izlazak"}
    - Vremenske prilike / Sezona: ${vreme || "umereno"}

    Dostupna odeća u ormanu (JSON niz):
    ${JSON.stringify(wardrobeList, null, 2)}

    PRAVILA:
    1. Ako izabereš HALJINU ("Dresses"), NEMOJ birati "Tops" ili "Bottoms". Uz nju ide samo Obuća ("Shoes") i/ili Aksesoari ("Accessories").
    2. Ako ne biraš haljinu, izaberi standardno 1x "Tops" + 1x "Bottoms" + 1x "Shoes".
    3. Vrati ISKLJUČIVO validan JSON sa tačnom strukturom navedenom ispod, bez ikakvog dodavanja markdown tagova ili teksta van JSON-a.

    Očekivani format odgovora:
    {
      "selected_item_ids": ["id1", "id2", "id3"],
      "naslov": "Kratak atraktivan naziv autfita",
      "obrazlozenje": "Kratko objašnjenje zašto ove boje i stilovi idu zajedno za navedenu priliku."
    }
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      const is503 =
        data.error.code === 503 || data.error.status === "UNAVAILABLE";
      const userMsg = is503
        ? "AI servis je trenutno preopterećen. Molimo pokušaj ponovo za par sekundi."
        : data.error.message;

      return new Response(JSON.stringify({ error: userMsg }), {
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
      JSON.stringify({
        error: err.message || "Greska pri generisanju autfita.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
