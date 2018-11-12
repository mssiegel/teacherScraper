const Excel = require('exceljs');
const puppeteer = require('puppeteer');
const request = require('request');
const rp = require('request-promise');

//This is the Main Code
//Before looking at this, make sure to understand the tutorials located at soda.js, excel.js, puppeteer.js
//soda.js - tutorial on how to use 'request-promise' module to query json data from NYC OpenData
//excel.js - tutorial on how to add data to an excel spreadsheet using javascript
//puppeteer.js - tutorial on how use puppeteer to enter names into Teacher Certification Lookup

/*
this code does the following things in order:
  1. Gets teacher data from NYC OpenData website
  2. Uses puppeteer to query each teacher name in the Teacher Certification Lookup
  3. Adds that info to existing excel spreadsheet called nycTeacherCertifications.xlxs

  Issues to be Addressed:
  This code will work fantastically for a few thousand names etc. However there, are a few problems with scale
    1. Reading from the excel doc may take a longer time as it starts getting filled with a few hundred thousand names
        -this issue is minor as the data can be broken up into several excel docs. Also, I suspect reading several hundred thousand excel rows to be fast enough anyways.
    2. This script searches about 1 name per second. There are 86,400 seconds in a day and 900,000 names to be searched. So the script will run for about 10 days.
        -the script will need to run 24/7 on a node.js server. It could be run in any node.js environment, such as AWS or a similar platform.
        -I don't know which AWS product will be used as I am not much familiar with running scripts on AWS.
        -A software engineer will have to run this script on AWS or a similar platform
    3. The issue mentioned in excel.js that AWS or similar platform may not have Microsoft Excel installed and so another spreadsheet API will have to be used
        - see issue in excel.js for more details
        - this is a MAJOR issue that needs to be addressed
        - note: Google spreadsheets seems to have self-explanatory API located at: https://developers.google.com/sheets/api/quickstart/nodejs
    4. It is possible that all this web scraping will crash the Teacher Certification Lookup website.
         - There is no way to know if this will happen until the script gets run
         - I don't think this will happen though as each name is searched sequentially, so the website gets only 1 query at a time
*/

//starting after 18 teacher in, i.e. at teacher #19, gets certifications matching 6 teachers from NYC OpenData, and adds them to nycTeacherCertifications.xlxs
mainCode(18,6)


//initial offset is which teacher number to begin at
//totalDesired is how many teachers to query
//limitPerIteration should generally be ignored and left to its default value of totalDesired
  //limitPerIteration comes into play if you're searching lots of teacher names, say 500,000 or more
  //the JavaScript engine may not be able to store all 500,000 names as a single variable (a string) - i.e. may be too large of a string to be stored in memory
  //So if you want to query several hundred thousand teacher names, then you set totalDesired to 500,000 and limitPerIteration to 100,000 - so only 100,000 get run at once

//lets say you've already searched 10 teachers and want another 7 teachers, i.e. your excel doc already has first 10 teachers
  //then you will set initial offset to be 10 - so that you'll start with the 11th teacher
  //and will set totalDesired to be 7 - so that you'll query teachers 11 through 17

async function mainCode(initialOffset = 0, totalDesired = 2, limitPerIteration = totalDesired) {
  //run the function that queries NYC OpenData and returns info as a plain Javascript object, i.e. parsed JSON
  const employeesData = await getDataFromNYOpenData(initialOffset, totalDesired, limitPerIteration);
  const rowsForExcel = [];

  //Sets up Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 657 });
  await page.goto('http://eservices.nysed.gov/teach/certhelp/CpPersonSearchExternal.jsp');
  await page.waitFor('.nav-footer');//waits for bottom most item on page to load

  for (const employee of employeesData){
    //variables have a ||'' so that values that don't exist become equal to an empty string
    const firstName = employee.first_name, lastName = employee.last_name, middleInitial = employee.mid_init||'', titleDescription = employee.title_description||'', workLocation = employee.work_location_borough||'', agencyName = employee.agency_name||'', leaveStatus = employee.leave_status_as_of_july_31||'', agencyStartDate = employee.agency_start_date||'', baseSalary = employee.base_salary||'', fiscalYear = employee.fiscal_year||'', otHours = employee.ot_hours||'', payBasis = employee.pay_basis||'', grossPaid = employee.regular_gross_paid||'', regularHours = employee.regular_hours||'', totalOtPaid= employee.total_ot_paid||'', otherPay = employee.total_other_pay||'';

    //dataFromNYOpenData is an array with all data in the specific correct order that matches our excel file of nycTeacherCertifications.xlxs
    const dataFromNYOpenData = [middleInitial, titleDescription, workLocation, agencyName, leaveStatus, agencyStartDate, baseSalary, fiscalYear, otHours, payBasis, grossPaid, regularHours, totalOtPaid, otherPay, firstName, lastName];

    //run the puppeteer function
    const dataFromPuppeteer = await getCertificateData(page, firstName, lastName, middleInitial)
    if(dataFromPuppeteer) {
      dataFromPuppeteer.forEach(teacherPuppeteerData => rowsForExcel.push([...dataFromNYOpenData, ...teacherPuppeteerData]))
    }
  }

  //Puppeteer is finished so close browser
  await browser.close();

  //run function to add all results to Excel
  await addRowsToExcel(rowsForExcel);

  console.log(`Added ${rowsForExcel.length} rows to nycTeacherCertifications.xlxs`);
  console.log('FINISHED!!!')
}



//HELPER FUNCTIONS
async function getDataFromNYOpenData(initialOffset, totalDesired, limitPerIteration){
  totalDesired += initialOffset;
  const employees = []
  while(initialOffset < totalDesired) {
    const options = {
      uri: `https://data.cityofnewyork.us/resource/4qxi-jgbe.json?$limit=${limitPerIteration}&$offset=${initialOffset}&$where=title_description like "%25TEACHER%25"`,
      headers: {'User-Agent': 'Request-Promise'},
      json: true // Automatically parses the JSON string in the response
    }
      const employeeData = await rp(options)
      employeeData.forEach(employee => {
        //trim() is important as these properties sometimes have unnecessary spacing at the beginnning
        //For instance 'Teacher Special Education' is also listed as   '    Teacher Special Education'
        employee.title_description = employee.title_description.trim()
        employee.work_location_borough = employee.work_location_borough.trim()
      })
      employees.push(...employeeData)
      initialOffset += limitPerIteration
  }
  return employees
}

async function getCertificateData(page, firstName='', lastName='', middleInitial='') {
  if(!firstName || !lastName) return false;
  console.log(`starting puppeteer script for: ${firstName}, ${lastName}, ${middleInitial}`)

  //Submits teacher name to be searched
  await page.evaluate((firstName) => document.querySelector("input[name=firstName]").value = firstName, firstName)
  await page.evaluate((lastName) => document.querySelector("input[name=lastName]").value = lastName, lastName)
  await page.evaluate((middleInitial) => document.querySelector("input[name=middleName]").value = middleInitial, middleInitial)
  await page.click('input[value=Submit]')
  await page.waitFor('.nav-footer');

  //searchResults is an array of all teachers, and their basic info, that were returned from the search
  const searchResults = await page.evaluate(() =>
      //[...NodeList] converts the nodeList to a real array that can be mapped
      [...document.querySelectorAll('#sTable tbody tr')].map(tr => {
      const personInfo = tr.innerText.split(/\n|\t/);
      personInfo.shift(); //removes empty first column of 'View Detail'
      if (personInfo.length === 7) personInfo.pop(); // removes empty last column that occurs if row ends with a \n
      personInfo.splice(0,2) // removes first 2 columns, i.e. first name and last name from the array
      return personInfo;
    })
  );

  //If no matching name was found return false
  if (searchResults.length === 0) return false;

  //Note: the table at http://eservices.nysed.gov/teach/certhelp/CpPersonSearchExternal.do called 'Certified by the State of New York...' is unneeded and is purposely ignored


  const finalResults = [];

  //iterates through searchResults via selecting each teacher, clicking 'View Detail', and scraping all their certificateInfo
    //it then pushes into finalResults an array containing each teachers' basic info and their certificate info

  //Note: The format of finalResults is specifically set up to match the format of nycTeacherCertifications.xlxs
    //nycTeacherCertifications is set up so that all certificates are in ONE SINGLE COLUMN:
      //this is done so all excel rows can be filtered easily by SPECIFIC certificates
  for (let i = 0; i < searchResults.length; i++){
    const curTeacherInfo = searchResults[i]
    await page.click(`input[name=selectedIndex][value="${i}"]`)
    await page.click('input[value="View Detail"]')
    await page.waitFor('.nav-footer');
    const certificateInfo = await page.evaluate(() =>
      [...document.querySelectorAll('.table')[1].querySelectorAll('tbody tr')].map(tr =>
         tr.innerText.split(/\n|\t/)
      )
    );
    certificateInfo.forEach(certificate => finalResults.push([...curTeacherInfo, ...certificate]))
  }
  return finalResults
}


async function addRowsToExcel(rows) {
  const workbook = new Excel.Workbook();
  const text = await workbook.xlsx.readFile('nycTeacherCertifications.xlsx')
  const worksheet = workbook.getWorksheet(1)
  await worksheet.addRows(rows)
  await workbook.xlsx.writeFile('nycTeacherCertifications.xlsx')
}
