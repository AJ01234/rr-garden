import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/atishay jain/Downloads/Mobile Devices/RR_Garden_Tracker.xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const overview = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 12000,
  tableMaxRows: 12,
  tableMaxCols: 24,
  tableMaxCellChars: 100,
});
console.log(overview.ndjson);

for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange(true);
  console.log("SHEET", sheet.name, "USED", used?.address);
  const region = await workbook.inspect({
    kind: "region",
    sheetId: sheet.name,
    range: "A1:Z80",
    maxChars: 20000,
    tableMaxRows: 80,
    tableMaxCols: 26,
    tableMaxCellChars: 120,
  });
  console.log(region.ndjson);
}
