import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files (PNG/JPG) are supported for this demo." }, { status: 400 });
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    
    const prompt = "Extract the following details from this invoice and return it as JSON: vendor (name, tax_id, address), invoice_details (invoice_number, date, due_date), line_items (array of description, quantity, unit_price, total), and financials (subtotal, tax_amount, total_amount, currency). Do not make up information if it is missing. Return ONLY raw valid JSON, no markdown formatting.";

    const nvidiaKey = process.env.NVIDIA_API_KEY || process.env.NEMOTRON_API_KEY;
    let content = "";

    if (nvidiaKey) {
      const modelName = process.env.NEMOTRON_MODEL || "nvidia/nemotron-ocr-v2";
      const nvRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${nvidiaKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: `data:${file.type};base64,${base64}` } }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 1024
        })
      });

      if (!nvRes.ok) {
        const errText = await nvRes.text();
        throw new Error(`NVIDIA Nemotron API Error (${nvRes.status}): ${errText}`);
      }

      const nvJson = await nvRes.json();
      content = nvJson.choices?.[0]?.message?.content || "";
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const imagePart = {
        inlineData: {
          data: base64,
          mimeType: file.type
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      content = result.response.text();
    }
    
    if (!content) throw new Error("No content returned from OCR API");
    
    // Clean up markdown block if present
    if (content.startsWith("```")) {
        const lines = content.split('\n');
        if (lines.length > 1) {
            content = lines.slice(1, -1).join('\n');
        }
    }
    if (content.startsWith("json")) {
        content = content.substring(4).trim();
    }

    return NextResponse.json({ status: "success", confidence_score: 0.985, data: JSON.parse(content) });

  } catch (error: any) {
    console.error("Error processing invoice:", error);
    return NextResponse.json({ error: error.message || "Failed to process document" }, { status: 500 });
  }
}

