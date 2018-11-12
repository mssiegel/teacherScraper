# teacherScraper
Gets teacher names, finds their teacher certificates, and uploads all the data to an excel file

To get started, download this git repository and then run 'npm install' and then 'node teacherScraper.js'

soda.js - tutorial on how to use 'request-promise' module to query json data from NYC OpenData

excel.js - tutorial on how to add data to an excel spreadsheet using javascript

puppeteer.js - tutorial on how use puppeteer to enter names into Teacher Certification Lookup

teacherScraper.js contains the main code to run the script.  Look there first. 
teacherScraper.js does the following things in order:
  1. Gets teacher data from NYC OpenData website
  2. Uses puppeteer to query each teacher name in the Teacher Certification Lookup
  3. Adds that info to existing excel spreadsheet called nycTeacherCertifications.xlxs

  
  Issues to be Addressed:
  This code will work fantastically for a few thousand names etc. However there, are a few problems with scale:
    
    1. Reading from the excel doc may take a longer time as it starts getting filled with a few hundred thousand names
        -this issue is minor as the data can be broken up into several excel docs. Also, I suspect reading several hundred thousand excel rows to be fast enough anyways.
        
    2. This script searches about 1 name per second. There are 86,400 seconds in a day and 900,000 names to be searched. So the script will run for about 10 days.
        -the script will need to run 24/7 on a node.js server. It could be run in any node.js environment, such as AWS or a similar platform.
        -A software engineer will have to run this script on AWS or a similar platform
        -I don't know which AWS product will be used as I am not much familiar with running scripts on AWS.
    
    3. The issue mentioned in excel.js that AWS or similar platform may not have Microsoft Excel installed and so another spreadsheet API will have to be used
        - see issue in excel.js for more details
        - this is a MAJOR issue that needs to be addressed
        - note: Google spreadsheets seems to have self-explanatory API located at: https://developers.google.com/sheets/api/quickstart/nodejs
    
    4. It is possible that all this web scraping will crash the Teacher Certification Lookup website.
         - There is no way to know if this will happen until the script gets run
         - I don't think this will happen though as each name is searched sequentially, so the website gets only 1 query at a time
