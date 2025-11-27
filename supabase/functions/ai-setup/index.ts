import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { parse } from "https://esm.sh/csv-parse@5.4.0/sync";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-gemini-key",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const text = formData.get("text");
        const type = formData.get("type"); // 'cnpj' | 'products'
        const userKey = req.headers.get("x-user-gemini-key");
        const authHeader = req.headers.get("Authorization");

        let apiKey = userKey;

        // Premium Check if no user key provided
        if (!apiKey && authHeader) {
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            const token = authHeader.replace("Bearer ", "");
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);

            if (user && !authError) {
                // Check if user is premium (mocked for now as we might not have the table set up perfectly)
                // In production: const { data } = await supabase.from('user_roles').select('is_premium').eq('user_id', user.id).single();
                // For MVP/Demo: We'll allow it if the env var is set, effectively making everyone "premium" if they don't provide a key but the server has one.
                // To be strict:
                // const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
                // if (role?.role === 'premium') apiKey = Deno.env.get("GEMINI_API_KEY");

                // Fallback for MVP:
                apiKey = Deno.env.get("GEMINI_API_KEY");
            }
        }

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "API Key required. Please provide a Gemini API Key or upgrade to Premium." }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        if (type === "cnpj") {
            if (!file || !(file instanceof File)) {
                throw new Error("File required for CNPJ extraction");
            }

            const arrayBuffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

            const prompt = `
        Extract the following fields from this CNPJ Card or Social Contract.
        Return ONLY valid JSON:
        {
          "razao_social": "string",
          "nome_fantasia": "string",
          "cnpj": "string (formatted XX.XXX.XXX/XXXX-XX)",
          "endereco": {
            "logradouro": "string",
            "numero": "string",
            "bairro": "string",
            "municipio": "string",
            "uf": "string (2 chars, valid BR state)",
            "cep": "string"
          },
          "cnae_principal": "string (code only)",
          "atividade_principal": "string",
          "regime_tributario": "string (Simples Nacional | Lucro Presumido | Lucro Real - infer if possible, otherwise null)"
        }
      `;

            const result = await model.generateContent([prompt, { inlineData: { data: base64, mimeType: file.type } }]);
            const response = await result.response;
            const jsonStr = response.text().replace(/```json\n?|\n?```/g, "").trim();
            const data = JSON.parse(jsonStr);

            return new Response(JSON.stringify({ data }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });

        } else if (type === "products") {
            let csvContent = "";

            if (file && file instanceof File) {
                csvContent = await file.text();
            } else if (text) {
                csvContent = text.toString();
            } else {
                throw new Error("CSV file or text required for products");
            }

            // Parse CSV
            const records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });

            // Batching (Gemini has limits, and context window is large but it's better to be safe and structured)
            const BATCH_SIZE = 20;
            const batches = [];
            for (let i = 0; i < records.length; i += BATCH_SIZE) {
                batches.push(records.slice(i, i + BATCH_SIZE));
            }

            const processedResults = [];

            for (const batch of batches) {
                const prompt = `
          You are a Tax Expert. Analyze this list of products and suggest the best NCM code (8 digits) for each.
          Input JSON: ${JSON.stringify(batch)}
          
          Return ONLY a JSON Array where each object has:
          - original_name: (from input)
          - ncm_sugerido: (8 digits only)
          - descricao_ncm: (short description of the NCM)
          - confidence: (high/medium/low)
        `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const jsonStr = response.text().replace(/```json\n?|\n?```/g, "").trim();
                try {
                    const batchResult = JSON.parse(jsonStr);
                    if (Array.isArray(batchResult)) {
                        // Merge original data with AI results
                        const merged = batchResult.map((res: any, idx: number) => ({
                            ...batch[idx], // Keep original CSV columns
                            ...res
                        }));
                        processedResults.push(...merged);
                    }
                } catch (e) {
                    console.error("Error parsing batch", e);
                    // Fallback: push original without NCM
                    processedResults.push(...batch);
                }
            }

            return new Response(JSON.stringify({ data: processedResults }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        throw new Error("Invalid type");

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
