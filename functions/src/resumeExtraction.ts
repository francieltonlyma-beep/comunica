import {PDFParse} from 'pdf-parse';
import * as mammoth from 'mammoth';

export const RESUME_EXTRACTION_VERSION = 2;
const MAX_TEXT_LENGTH = 180000;

export type ResumeExtraction = {text: string; readable: boolean; truncated: boolean};

export async function extractResumeText(bytes: Buffer, contentType: string): Promise<ResumeExtraction> {
  try {
    let text = '';
    if (contentType === 'application/pdf') {
      const parser = new PDFParse({data: bytes});
      try {
        text = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    } else {
      text = (await mammoth.extractRawText({buffer: bytes})).value;
    }
    const cleaned = text.replace(/\u0000/g, '').replace(/[ \t]+/g, ' ').trim();
    return {text: cleaned.slice(0, MAX_TEXT_LENGTH), readable: cleaned.length >= 20, truncated: cleaned.length > MAX_TEXT_LENGTH};
  } catch {
    // A damaged or scanned file must not silently prevent a human review.
    return {text: '', readable: false, truncated: false};
  }
}
