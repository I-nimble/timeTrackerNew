import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PdfInvoiceService {

  constructor() { }

  generatePDF(name: string, selectedPayment: any){

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format:'a4'
    })

    const img = new Image();
    img.src = `${environment.assets}/inimble.png`;

    const imageWidth = 55; 
    const imageHeight = 15; 
    const pageWidth = doc.internal.pageSize.width; 

    const ximage = (pageWidth - imageWidth) / 2; 
    doc.addImage(img, 'PNG', ximage, 10, imageWidth, imageHeight);


    // Content

    doc.setFont('Helvetica');
    doc.setFontSize(14);
    const title = 'BILL PAYMENT';
    const textWidth = doc.getTextWidth(title);
    const x = (doc.internal.pageSize.width - textWidth) / 2;
    doc.text(title, x, 40);

    // Date "dd/MM/yyyy"
    doc.setFont('Helvetica');
    doc.setFontSize(12);
    const date = 'Date:';
    const datei = new Date(selectedPayment.updated_at).toLocaleDateString('es-ES');
    doc.text(`${date} ${datei}`, 20, 50);
    const xdatei = (doc.internal.pageSize.width - 20)

    // Client
    doc.setFontSize(12);
    const client = `Client: ${name}`;
    doc.text(client, 20, 60);

    // Description
    const description = `Description: ${selectedPayment.description}`;
    doc.text(description, 20, 70);

    // Amount
    const amount = `Amount: $USD ${selectedPayment.amount}`;
    doc.text(amount, 20, 80);

    // Save the PDF in a variable
    const pdfOutput = doc.output('blob');

    // Create a download link
    const downloadLink = document.createElement('a');
    const fileName = `invoice_${datei}.pdf`;

    // Assign the download link and file name
    downloadLink.href = URL.createObjectURL(pdfOutput);
    downloadLink.download = fileName;
    downloadLink.click();

  }
}
