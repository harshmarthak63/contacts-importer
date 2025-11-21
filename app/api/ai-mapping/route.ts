import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

export async function POST(request: NextRequest) {
  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Mistral API key is not configured. Please set MISTRAL_API_KEY in your environment variables.' },
      { status: 500 }
    );
  }

  const client = new Mistral({
    apiKey: apiKey,
  });
  
  try {
    const { sampleData, headers, internalFields } = await request.json();

    if (!sampleData || !Array.isArray(sampleData) || sampleData.length === 0) {
      return NextResponse.json(
        { error: 'Sample data is required' },
        { status: 400 }
      );
    }

    if (!headers || !Array.isArray(headers)) {
      return NextResponse.json(
        { error: 'Headers are required' },
        { status: 400 }
      );
    }

    if (!internalFields || !Array.isArray(internalFields)) {
      return NextResponse.json(
        { error: 'Internal fields are required' },
        { status: 400 }
      );
    }

    const firstRow = sampleData[0];
    const internalFieldsDesc = internalFields.map(f => `- "${f.label}" (key: ${f.key})`).join('\n');

    const prompt = `You are a field mapper for a CRM contact import system.

Available Internal Fields:
${internalFieldsDesc}

CSV Columns with sample values:
${JSON.stringify(firstRow, null, 2)}

Your task: Map each CSV column to the most appropriate internal field key.

Output format: Return ONLY a valid JSON object where:
- Keys are CSV column names (exactly as they appear in the CSV)
- Values are internal field keys (exactly as shown above)

Example output format:
{
  "First Name": "firstName",
  "Email Address": "email",
  "Phone Number": "phone"
}

Return only the JSON object, no additional text or explanation.`;

    const chatResponse = await client.chat.complete({
      model: 'mistral-medium-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const content = chatResponse.choices[0]?.message?.content;
    let text = '{}';
    
    if (typeof content === 'string') {
      text = content;
    } else if (Array.isArray(content)) {
      text = content
        .map(chunk => {
          if (typeof chunk === 'string') {
            return chunk;
          }
          if ('type' in chunk && chunk.type === 'text' && 'text' in chunk) {
            return chunk.text;
          }
          return '';
        })
        .join('');
    }
    
    let mapping: Record<string, string> = {};
    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      mapping = JSON.parse(cleanedText);
    } catch (err) {
      console.error('Failed to parse AI response:', err);
      return NextResponse.json(
        { error: 'Failed to parse AI mapping response' },
        { status: 500 }
      );
    }

    return NextResponse.json(mapping);
  } catch (error: any) {
    console.error('AI mapping error:', error);
    return NextResponse.json(
      { error: error.message || 'AI mapping failed' },
      { status: 500 }
    );
  }
}
