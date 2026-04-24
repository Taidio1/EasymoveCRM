
import { PDFDocument } from 'pdf-lib';
import { promises as fs } from 'fs';
import * as path from 'path';

async function inspectPdfFields() {
  try {
    const pdfPath = path.resolve(process.cwd(), 'pdf/zalacznik_nr_1_do_wniosku_o_udzielenie_zezwolenia_na_pobyt_czasowy_i_prace.pdf');
    console.log(`Loading PDF from: ${pdfPath}`);

    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { 
      // Some PDFs might need this setting to parse fields correctly
      updateMetadata: false 
    });

    const form = pdfDoc.getForm();
    const fields = form.getFields();

    if (fields.length === 0) {
      console.log('No interactive form fields found in this PDF.');
      return;
    }

    console.log('Found the following form fields:');
    fields.forEach(field => {
      const type = field.constructor.name;
      const name = field.getName();
      console.log(`- Name: "${name}", Type: ${type}`);
    });

  } catch (error) {
    console.error('Error inspecting PDF:', error);
  }
}

inspectPdfFields();
