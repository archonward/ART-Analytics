import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pdf from 'pdf-parse';
import OpenAI from 'openai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 4000);
const PDF_STORAGE_DIR = process.env.PDF_STORAGE_DIR || path.resolve(__dirname, '../private-pdfs');
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const tickerPattern = /^[A-Z]{1,5}$/;

async function verifyNyseTicker(ticker) {
  const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`);

  if (!response.ok) {
    throw new Error(`Ticker lookup failed with status ${response.status}`);
  }

  const data = await response.json();
  const quote = data?.quoteResponse?.result?.[0];

  if (!quote) {
    return { valid: false, reason: 'Ticker was not found.' };
  }

  const exchangeName = quote?.fullExchangeName || quote?.exchange || '';
  const isNyse = /new york stock exchange|nyse|nyq/i.test(exchangeName);

  if (!isNyse) {
    return {
      valid: false,
      reason: `Ticker exists but is not listed on NYSE (detected exchange: ${exchangeName || 'unknown'}).`
    };
  }

  return {
    valid: true,
    exchange: exchangeName,
    companyName: quote?.longName || quote?.shortName || ticker
  };
}

async function summarizeResearchWithAI({ ticker, companyName, researchText }) {
  if (!openai) {
    throw new Error('OPENAI_API_KEY is missing on the backend.');
  }

  const prompt = `
You are a buy-side equity research assistant.
A user searched for ticker ${ticker} (${companyName}).
Summarize the following analyst research PDF text in a way that keeps the original intent of the author.

Required output sections:
1) Thesis Snapshot (3 bullet points)
2) Key Financial Signals (bulleted list)
3) Risks / Bear Case (bulleted list)
4) Near-Term Watchlist (bulleted list)
5) Plain-English Summary (5-7 sentences)

Avoid adding facts that are not in the source text.
Source text:\n\n${researchText.slice(0, 18000)}
`.trim();

  const result = await openai.responses.create({
    model: OPENAI_MODEL,
    input: prompt
  });

  return result.output_text?.trim() || 'No summary was returned from the AI model.';
}

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.get('/api/stock-summary', async (req, res) => {
  try {
    const tickerRaw = String(req.query.ticker || '').toUpperCase().trim();

    if (!tickerPattern.test(tickerRaw)) {
      return res.status(400).json({ error: 'Please enter a valid stock ticker (1-5 uppercase letters).' });
    }

    const tickerCheck = await verifyNyseTicker(tickerRaw);
    if (!tickerCheck.valid) {
      return res.status(400).json({ error: tickerCheck.reason });
    }

    const pdfPath = path.join(PDF_STORAGE_DIR, `${tickerRaw}.pdf`);

    let pdfBuffer;
    try {
      pdfBuffer = await fs.readFile(pdfPath);
    } catch {
      return res.status(404).json({
        error: `No private research PDF found for ${tickerRaw}. Expected: ${pdfPath}`
      });
    }

    const parsed = await pdf(pdfBuffer);
    const cleanText = parsed.text?.replace(/\s+/g, ' ').trim();

    if (!cleanText) {
      return res.status(422).json({ error: `The PDF for ${tickerRaw} did not contain extractable text.` });
    }

    const summary = await summarizeResearchWithAI({
      ticker: tickerRaw,
      companyName: tickerCheck.companyName,
      researchText: cleanText
    });

    return res.json({
      ticker: tickerRaw,
      companyName: tickerCheck.companyName,
      exchange: tickerCheck.exchange,
      summary
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Failed to summarize the research PDF. Check backend logs and environment variables.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`ART Analytics backend listening on http://localhost:${PORT}`);
  console.log(`Using private PDF directory: ${PDF_STORAGE_DIR}`);
});
