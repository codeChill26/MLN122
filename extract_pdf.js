import fs from 'fs';
import pdf from 'pdf-parse';

let dataBuffer = fs.readFileSync('./public/images/GIAO TRINH KINH TE CHINH TRI MAC - LENIN (Quoc gia).pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('./public/extracted_text.txt', data.text);
    console.log("Extraction complete. Pages: ", data.numpages);
}).catch(function(error) {
    console.error("Error extracting PDF:", error);
});
