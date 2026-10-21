import {PDFParse} from 'pdf-parse';
import * as mammoth from 'mammoth';

export type ResumeExtraction = {text: string; readable: boolean};

export async function extractResumeText(bytes: Buffer, contentType: string): Promise<ResumeExtraction> {
  try {
    let text = '';
    if (contentType === 'application/pdf') {
      const parser = new PDFParse({data: bytes});
      try {
        text = (await parser.getText({first: 10})).text;
      } finally {
        await parser.destroy();
      }
    } else {
      text = (await mammoth.extractRawText({buffer: bytes})).value;
    }
    const cleaned = text.replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, 12000);
    return {text: cleaned, readable: cleaned.length >= 20};
  } catch {
    // A damaged or scanned file must not silently prevent a human review.
    return {text: '', readable: false};
  }
}
