const Excel = require('exceljs');

/*
This code shows how to add rows to an existing Excel worksheet
Official exceljs docs can be found at https://www.npmjs.com/package/exceljs
*/


//Note: This code only works if the computer it runs on has Microsoft Excel installed. This has MAJOR implications:
  //My laptop has Microsoft Excel installed, so it can of course save the results in an Excel file
  //Though the teacherScraper.js works on my laptop the script will have to run on a professional 24/7 hosted service such as AWS
  //I never looked into if AWS has Excel or any spreadsheet format preinstalled. If it doesn't then it obviously cannot output/save an excel file
  //If so an API for an online spreadsheet version will have to be found - perhaps an online version of Excel or Google Spreadsheets
  //note: Google spreadsheets seems to have self-explanatory API located at: https://developers.google.com/sheets/api/quickstart/nodejs


addDataToExcelDoc('writetoexcel.xlsx')

//Adds rows to existing spreadsheet
  //note: existing filename MUST actually exist:
async function addDataToExcelDoc(filename) {
  const workbook = new Excel.Workbook();
  //read and save text from existing excel doc into a variable
  const text = await workbook.xlsx.readFile(filename)
  const worksheet = workbook.getWorksheet(1)
  const rows = [
      [55,"trading","sekar",new Date(2017-02-12),"ashok leyaland","arun","modeling","Y"],
      [99,"training",new Date(2018-02-13),"tata motors","dhana","reference name","wheldding","Y"]]
  worksheet.addRows(rows)
  await workbook.xlsx.writeFile(filename)
  console.log(`added ${rows.length} rows to ${filename}`)
}
