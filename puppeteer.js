const puppeteer = require('puppeteer');
console.log('starting script');

/*
Puppeteer is a headless browser published by the Chrome team that lets you automate a Chrome browser via JavaScript code
This code shows how to use pupeteer to look up a teacher name using Teacher Certification Lookup at: http://eservices.nysed.gov/teach/certhelp/CpPersonSearchExternal.do
A fantastic Puppeteer tutorial can be found here: https://codeburst.io/a-guide-to-automating-scraping-the-web-with-javascript-chrome-puppeteer-node-js-b18efb9e9921
Official Puppeteer doc is located at https://github.com/GoogleChrome/puppeteer/
Official puppeteer API docs can be found at https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
*/


(async () => {
  const info = await submitName('lorraine', 'smith', 'c');
  console.log(info);
})()

async function submitName(firstName='', lastName='', middleName='') {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 657 });
    await page.goto('http://eservices.nysed.gov/teach/certhelp/CpPersonSearchExternal.jsp');

    //ensure that entire page loads by waiting until loading of '.nav-footer' which is bottom most item on page
    await page.waitFor('.nav-footer');

    //Enters first name, last name, and middle initial into relevant fields
    await page.evaluate((firstName) => document.querySelector("input[name=firstName]").value = firstName, firstName)
    await page.evaluate((lastName) => document.querySelector("input[name=lastName]").value = lastName, lastName)
    await page.evaluate((middleName) => document.querySelector("input[name=middleName]").value = middleName, middleName)

    //click the submit button
    await page.click('input[value=Submit]')
    //ensure that entire page loads by waiting until loading of '.nav-footer' which is bottom most item on page
    await page.waitFor('.nav-footer');

    //to understand the following code, you'll have to use 'view source' on the actual Teacher Certifcation Website and see their html code yourself
    //serachResults will be an array containing all teachers that popped up
    const searchResults = await page.evaluate(() =>
        [...document.querySelectorAll('#sTable tbody tr')].map(tr => {
        const personInfo = tr.innerText.split(/\n|\t/);
        personInfo.shift(); //removes empty first column of 'View Detail'
        if (personInfo.length === 7) personInfo.pop(); // removes empty last column that occurs if row ends with a \n
        return personInfo;
      })
    );

    if (searchResults.length === 0) return ['Name not found in NY Teacher Certification Lookup']

    const finalResults = [];

    //to understand the following code, you'll have to use 'view source' on the actual Teacher Certifcation Website and see their html code yourself

    //for loop through each teacher in searchResults array
    for (let i = 0; i < searchResults.length; i++){
      const curPersonInfo = searchResults[i]
      //click view detail for each person and put their info into final results
      await page.click(`input[name=selectedIndex][value="${i}"]`)
      await page.click('input[value="View Detail"]')
      await page.waitFor('.nav-footer');
      const certificateInfo = await page.evaluate(() =>
        document.querySelectorAll('.table')[1].querySelector('tbody').innerText.split(/\n|\t/)
      );
      finalResults.push([...curPersonInfo, ...certificateInfo])
    }

   //close the puppeteer browser
   await browser.close();
   return finalResults
}
