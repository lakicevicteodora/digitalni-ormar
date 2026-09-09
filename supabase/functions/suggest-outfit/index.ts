import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { items, prilika, vreme, excludeItemIds } = await req.json();

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

    const izbegavajBlok =
      excludeItemIds && excludeItemIds.length > 0
        ? `\nVAŽNO: Korisnik je već video kombinaciju sa ID-jevima [${excludeItemIds.join(", ")}] i traži DRUGAČIJU. Obavezno izaberi bar jedan drugačiji komad odeće u odnosu na tu listu — nemoj vratiti identičnu kombinaciju.`
        : "";

    const promptText = `
Ti si lični modni stilista. Sastavi najbolji mogući autfit od PONUĐENIH komada odeće — svi predmeti su već filtrirani da odgovaraju trenutnoj sezoni/temperaturi.

Kontekst za autfit:
- Prilika: ${prilika || "svakodnevni izlazak"}
- Trenutno vreme: ${vreme || "nepoznato"}

Dostupna odeća u ormanu (JSON niz):
${JSON.stringify(wardrobeList, null, 2)}
${izbegavajBlok}

PRAVILA:
1. Postoje DVA ravnopravna tipa kombinacije — nemoj automatski favorizovati jedan:
   a) Haljina (Dresses) + Obuća (Shoes) + opciono Aksesoari — NIKAD ne dodaji Tops ili Bottoms uz haljinu.
   b) Gornji deo (Tops) + Donji deo (Bottoms) + Obuća (Shoes) + opciono Aksesoari.
2. Ako u ponudi postoji bar jedna haljina koja odgovara prilici, opcija (a) je JEDNAKO validna kao opcija (b) — ne biraj (b) samo zato što je uobičajenije.
3. Vrati ISKLJUČIVO validan JSON, bez markdown tagova.

Format odgovora:
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
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.9,
            thinkingConfig: { thinkingLevel: "low" },
          },
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
