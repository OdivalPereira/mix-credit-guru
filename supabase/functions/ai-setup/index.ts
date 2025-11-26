import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

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
        const type = formData.get("type"); // 'cnpj' | 'products' | 'suppliers'
        const userKey = req.headers.get("x-user-gemini-key");

        // Determine API Key: User provided > Env variable (Premium)
        // For this MVP, we'll prioritize the user key, or fall back to env if available (and authorized)
        const apiKey = userKey || Deno.env.get("GEMINI_API_KEY");

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: "API Key required. Please provide a Gemini API Key." }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let prompt = "";
        let inputData: any = "";

        if (type === "cnpj") {
            prompt = `
        Extract the following information from the provided document (CNPJ card or Social Contract).
        Return ONLY valid JSON with this structure:
        {
          "razao_social": "string",
          "nome_fantasia": "string",
          "cnpj": "string (formatted XX.XXX.XXX/XXXX-XX)",
          "endereco": {
            "logradouro": "string",
            "numero": "string",
            "bairro": "string",
            "municipio": "string",
            "uf": "string (2 chars)",
            "cep": "string"
          },
          "cnae_principal": "string (code only)",
          "atividade_principal": "string"
        }
      `;
            if (file && file instanceof File) {
                // Handle file upload (simplified for text/pdf if supported by Gemini directly or via text extraction)
                // For MVP, assuming text-based PDF or image that Gemini can process if we send base64
                // Note: Gemini API file handling might require upload API for large files.
                // For simplicity in this Edge Function, we'll assume the client sends text extracted or we use a vision model if it's an image.
                // If it's a PDF, we might need a parsing step or use Gemini 1.5 Pro with PDF support.
                // Let's assume for now we are sending text or base64 image.

                // If file is image, convert to base64
                const arrayBuffer = await file.arrayBuffer();
                const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

                inputData = [prompt, { inlineData: { data: base64, mimeType: file.type } }];
            } else {
                throw new Error("File required for CNPJ extraction");
            }
        } else if (type === "products") {
            prompt = `
        Parse the following product list and suggest NCM codes.
        Return ONLY valid JSON array:
        [
          {
            "nome": "string",
            "ncm_sugerido": "string (8 digits)",
            "preco_medio": number (optional, default 0),
            "unidade": "string (e.g., UN, KG)"
          }
        ]
        Input Text:
        ${text}
      `;
            inputData = prompt;
        } else if (type === "suppliers") {
            prompt = `
        Parse the following supplier list.
        Return ONLY valid JSON array:
        [
          {
            "nome": "string",
            "cnpj": "string (optional)",
            "categoria": "string (Indústria | Distribuidor | Atacado)"
          }
        ]
        Input Text:
        ${text}
      `;
            inputData = prompt;
        } else {
            throw new Error("Invalid type specified");
        }

        const result = await model.generateContent(inputData);
        const response = await result.response;
        const textResponse = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = textResponse.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(jsonStr);

        return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
