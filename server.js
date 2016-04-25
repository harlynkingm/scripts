const fs = require("fs");
const async = require("async");
const request = require("request");
const jsdom = require("jsdom").jsdom;
const fountain = require('fountain-js');
const cheerio = require('cheerio');
const util = require("util");
const moment = require("moment");
const exec = require('child_process').exec;
//const movieObj = require(`${__dirname}/../../data/js/movieObj`);
const movieObj = require(`./movieObj2`);
  

var startTime = moment();

var downloadedScrapeIds = [];
var pendingScrapeIds = [];

var failedDownloads = [];
var newFails = "scrape_id\n";

var html_paths = {
  "http://www.imsdb.com": {
    path: "#mainbody > table:nth-child(3) > tbody > tr > td:nth-child(3) > table > tbody > tr > td > pre"
  }, 
  "http://www.lynchnet.com": {
    path: "body > pre"
  },
  "http://www.pages.drexel.edu/~ina22/splaylib": {
    path: "body > x-claris-window > x-claris-tagview > pre"
  },
  "http://leonscripts.": {
    path: "body > pre"
  },
  "http://www.aellea.com": {
    path: "body > pre"
  }, 
  "http://www.dailyscript.com": {
    path: "body > pre > blockquote > blockquote"
  }, 
  "http://www.horrorlair.com": {
    path: "body > div.Section1"
  },
  "http://www.pages.drexel.edu": {
    path: "body > x-claris-window > x-claris-remotesave > x-claris-tagview > pre"
  }, 
  "http://www.scifiscripts.com": {
    path: "body > pre > font"
  }, 
  "http://www.theneitherworld.com": {
    path: "body > pre"
  }
};

function cleanURL(url) {

  if(url.startsWith("http://www.imsdb.com/Movie Scripts/")){
    url = url.replace("http://www.imsdb.com/Movie Scripts/", "http://www.imsdb.com/scripts/");
    url = `${url.slice(0, -12).replace(/ /g, "-")}.html`;
    url = url.replace("-.html", ".html");
  }

  if(url.startsWith("http://www.sellingyourscreenplay.com/script-library/")){
    url = `${url}.html`;
  }

  url = url.replace("www.awesomefilm.comscript", "www.awesomefilm.com/script")

  return url;
}

async.series({
getListOfDownloadedScripts: (cb) => {
  
  var folders = ["pdf", "text"];

  async.forEachSeries(folders, (folder, cb1) => {
    var downloadDir = `${__dirname}/data/script_downloads/${folder}/`;

      fs.readdir(downloadDir, (err, files) => {

        async.forEachSeries(files, (file, cb2) => {

          var scrape_id = file.replace("scrape-", "")
                            .replace(".pdf", "")
                            .replace(".txt", "");

          if(downloadedScrapeIds.indexOf(scrape_id.toString()) === -1) {
            downloadedScrapeIds.push(scrape_id.toString());
          }
          async.setImmediate(() => { cb2(); });

        }, () => {
          async.setImmediate(() => { cb1(); });

        });
      });

  }, () => {

    async.forEachSeries(Object.keys(movieObj), (scrape_id, cb1) => {

      if(downloadedScrapeIds.indexOf(scrape_id.toString()) === -1 &&
        pendingScrapeIds.indexOf(scrape_id.toString()) === -1 &&
        failedDownloads.indexOf(scrape_id.toString()) === -1){

        pendingScrapeIds.push(scrape_id.toString())
      } 
      async.setImmediate(() => { cb1() });

    }, () => {
      console.log(`Total URLS (removing ignore):\t${downloadedScrapeIds.length + pendingScrapeIds.length}`)
      console.log(`Downloaded scripts:\t\t${downloadedScrapeIds.length}`)
      console.log(`Pending (nonfailed) scripts:\t${pendingScrapeIds.length}`)
      cb();
    })
  });   
},    
iterateMovies: (cb) => {
  
  var index = 1;

//   pendingScrapeIds = [2155, 3334, 3421, 3423, 3436, 4628, 4629, 5237, 6363, 6419, 6914, 7390, 7470, 7532, 7569, 7619, 8047, 8638, 8652, 8833];

  
  async.forEachSeries(pendingScrapeIds, (scrape_id, cb1) => {
    
    scrape_id = scrape_id.toString();

    var movie = movieObj[scrape_id];

    console.log("\n------------------")
    console.log(`${index}/${pendingScrapeIds.length}`)
    console.log(`Scrape id:\t${scrape_id}`)
    console.log(movie)
    if(typeof movie === "undefined"){
      console.log("IGNORE")
      async.setImmediate(() => { cb1(); })
    } else {
     
      var url = cleanURL(movie.link);

      console.log(url);
      console.log(movie.source)
      index++;

      if (movie.source === "imsdb") {
        fs.readFile(`${__dirname}/data/${movie.link}`, "utf8", (err, data) => {
          if(err){
            async.setImmediate(() => { cb1(); });
          } else {
            var $ = cheerio.load(data); 
            var selector = html_paths["http://www.imsdb.com"].path;

            console.log($(selector).length)
            if($(selector).length > 0){
              fs.writeFile(`${__dirname}/data/script_downloads/text/scrape-${scrape_id}.txt`, $(selector).text());
            }
            async.setImmediate(() => { cb1(); });
          }
         
        })
      } else if (movie.source === "scriptdrive") {
        fs.readFile(`${__dirname}/data/scriptdrive/${movie.link}`, (err, data) => {
          if(err){
            console.log(err)
            async.setImmediate(() => { cb1(); });
          } else {
              
            console.log(`${movie.link}`)
            fs.writeFile(`${__dirname}/data/script_downloads/pdf/scrape-${scrape_id}.pdf`, data);
            async.setImmediate(() => { cb1(); });
          }
         
        })
      } else if (movie.source === "cornell"){


          request.get({url: url, encoding: "binary", timeout: 120000}, (err, resp, body) => {

            if(err){
              console.log(err);
              newFails+= `${scrape_id}\n`;
              async.setImmediate(() => { cb1(); })
            } else {
              if(typeof resp !== "undefined" || resp.statusCode !== 404) {
                console.log(resp.caseless.dict['content-type'])

                if (resp.caseless.dict['content-type'] === "text/plain") {

                  console.log("TEXT")
                  fs.writeFile(`${__dirname}/data/script_downloads/text/scrape-${scrape_id}.txt`, resp.body);
                  async.setImmediate(() => { cb1(); });

                } else if (resp.caseless.dict['content-type'] === "application/pdf") {
                  
                  console.log("PDF")
                  fs.writeFile(`${__dirname}/data/script_downloads/pdf/scrape-${scrape_id}.pdf`, body, 'binary');
                  async.setImmediate(() => { cb1(); });

                } else if (resp.caseless.dict['content-type'] === "text/html"  || resp.caseless.dict['content-type'].toLowerCase() === "text/html; charset=utf-8") {

                  console.log("HTML")
                  var matchedUrl = null;
                  for(var p in html_paths){
                    if(url.toLowerCase().startsWith(p.toLowerCase())){
                      matchedUrl = p;
                      break;
                    }
                  }

                  var $ = cheerio.load(body); 

                  if(matchedUrl){
                    
                    fs.writeFile(`${__dirname}/data/script_downloads/text/scrape-${scrape_id}.txt`, $(body).text());
                    async.setImmediate(() => { cb1(); })
                    

                  } else {
                    console.log("NO MATCH")
                    fs.writeFile(`${__dirname}/data/script_downloads/text/scrape-${scrape_id}.txt`, $(body).text());
                   
                    async.setImmediate(() => { cb1(); })
                  }
                    
                } else {
                  newFails+= `${scrape_id}\n`;
                  async.setImmediate(() => { cb1(); })
                }
              } else {
                async.setImmediate(() => { cb1(); })
              }
            }
          });
        
        
      } else {
        console.log("BAD SOURCE")
        async.setImmediate(() => { cb1(); })
      }
    } 

  }, () => {
    fs.writeFile(`${__dirname}/data/dead-links.tsv`, newFails)
    cb();
  })
},
turnPDFsToText: (cb) => {
  
  var downloadDir = `${__dirname}/data/script_downloads`;
  var pdfDirectory = `${downloadDir}/ocr_output/`;

  fs.readdir(pdfDirectory, (err, pdfs) => {

    var failedPDFScans = "";
    var index = 1;

    async.forEachSeries(pdfs, (pdf, cb1) => {

      if(pdf !== ".DS_Store"){
        var fileName = pdf.slice(0, -4);
        var inputPDF = `${pdfDirectory}${pdf}`;
        var outputTxt = `${downloadDir}/text/${fileName}.txt`

        index++;

        //console.log(outputTxt)
        fs.exists(inputPDF, (exists) => {
          //if(true){
          if(exists) {

            console.log("--------------------------")
            console.log(fileName)
            console.log(`${index}/${pdfs.length}`)

            async.series({
              removePermissions: (cb2) => {

                console.log("removing passwords")
                exec(`mv ${inputPDF} ${pdfDirectory}temp.pdf; qpdf --decrypt ${pdfDirectory}temp.pdf ${inputPDF}; rm ${pdfDirectory}temp.pdf`,
                   (err, stdout, stderr) => {
                  if(err || stderr){
                    console.log(err)
                    console.log(stderr)
                  }
                  async.setImmediate(() => { cb2(); })
                });

              }, 
              textExtract: (cb2) => {

                console.log("extracting text")
                exec(`python ${__dirname}/data/pdfminer-20140328/build/scripts-2.7/pdf2txt.py ${inputPDF}`, 
                  { maxBuffer: 1024 * 1000 },
                  (err, stdout, stderr) => {
                  if(err || stderr){
                    console.log(err)
                    console.log(stderr)
                    failedPDFScans += `${pdf}\n`
                  } else {
                    fs.writeFile(outputTxt, stdout)
                  }
                  async.setImmediate(() => { cb2(); })
                });
            
              }, 
              done: () => {
                 async.setImmediate(() => { cb1(); })
              }
            })

          
          } else {
            async.setImmediate(() => { cb1(); })
          }
        })
       
      } else {
        async.setImmediate(() => { cb1(); });
      }
     
    }, () => {
      console.log(failedPDFScans)
      cb();
    })

  })

},
done: () => {
  console.log(moment().diff(startTime, "minutes"))
  console.log("Finished: script-download.js")

}
});


