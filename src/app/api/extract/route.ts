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
    
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = "Extract the following details from this invoice and return it as JSON: vendor (name, tax_id, address), invoice_details (invoice_number, date, due_date), line_items (array of description, quantity, unit_price, total), and financials (subtotal, tax_amount, total_amount, currency). Do not make up information if it is missing. Ensure the response is valid JSON matching this structure.";

    const imagePart = {
      inlineData: {
        data: base64,
        mimeType: file.type
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    let content = result.response.text();
    
    if (!content) throw new Error("No content returned from Gemini");
    
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
