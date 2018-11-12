const request = require('request');
const rp = require('request-promise');

/*
This code shows how to get json data of teachers from NYC OpenData
The original NYC OpenData dabase is at: https://data.cityofnewyork.us/City-Government/Citywide-Payroll-Data-Fiscal-Year-/k397-673e/data
To instally see how many teachers there are, simply visit the OpenData url, click filter, and add a filter for all Title Description's containing the word 'teacher'
When last checked in beginning of November 2018, the above filtering yielded about 900,000 teachers

To get the JSON format of the data, you will have to use the SODA API
The SODA API lets you programmatically assess the JSON Data and filter it using SQL queries
To find the SODA API, go to the NYC OpenData URL and click 'Export', then click 'SODA API', then click 'API Docs'
The SODA API DOCS are self-explanatory and will contain all you need on how to filter the data
*/

//will list 2 teachers
(async () => {
  const listedTeachers = await listTeachers(2)
  console.log('listing some teachers')
  console.log(listedTeachers)
})()

//getDataFromDatabase runs a query against the NYC OpenData SODA API and returns the results as a promise
function getDataFromDatabase(query){
  const options = {
      uri: 'https://data.cityofnewyork.us/resource/4qxi-jgbe.json?' + query,
      headers: {'User-Agent': 'Request-Promise'},
      json: true // Automatically parses the JSON string in the response
  };
  return rp(options)
}

//listTeachers lists first X employees from NYC OpenData database whose job titles contain the word teacher
async function listTeachers(integer) {
  const someTeachers = await getDataFromDatabase(`$limit=${integer}&$where=title_description like "%25TEACHER%25"`)
  return someTeachers
}

//returns a dictionary of key-value pairs where key is a job title and its value is how many teachers have that job title
//Note: this code goes through 900,000 teachers so of course will take longer to run (about 10 minutes)
//Note: the data from this script was used to create 'Total Teachers from NYCOpenData.txt'
//Note: similar functions to this one were used to create 'Total Agency Names from NYCOpenData.txt' and 'Total Teachers from NYCOpenData.txt'
async function getAllJobTitlesOfAllTeachers(limit){
  const jobTitles = {}
  const data = await getDataFromDatabase(`$where=title_description like "%25TEACHER%25"&$limit=${limit}`)
  data.forEach(employee => {
    const jobTitle = employee.title_description.trim()
      //trim() is important as some employee job titles are duplicated via spacing at beginnning
      //For instance 'Teacher Special Education' is also listed as '    Teacher Special Education'
    jobTitles[jobTitle] = ++jobTitles[jobTitle] || 1
  })
  return jobTitles
}

(async () => {
  const allJobTitles = await getAllJobTitlesOfAllTeachers(3000)
  console.log('\nlisting job titles')
  console.log(allJobTitles)
})()
