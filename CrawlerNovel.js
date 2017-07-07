const http = require('http');
const fs = require('fs');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

const Novel = {
  'title': '混元剑帝',
  'url': 'http://www.bequge.com/7_7559/',
  'Host': 'www.bequge.com',
  'list': [],
  'textPath': './txt'
}

let page = 0;

function promiseGetContext(){
  let promise = new Promise((resolve, reject) => {
    GetContext(Novel.list[page], resolve);
  })
  .then(function(){
    page += 1;
    if(page <= Novel.list.length){
      promiseGetContext();
    }
    else{
      console.log('爬取完毕');
    }
  })
}

function GetContext(url, resolve){
  http.get(`http://${Novel.Host}/${url}`, (req) => {
    let html = [];

    req.on('data', (data) => {
      html.push(data);
    })

    req.on('end', () => {
      html = iconv.decode(Buffer.concat(html), 'GBK');

      let $ = cheerio.load(html, {decodeEntities: false});

      let context = `${$('h1').html()}\r\n${$('#content').html().replace(/&nbsp/g, ' ').replace(/<br>/g, '\r\n')}`

      fs.appendFileSync(`${Novel.textPath}/${Novel.title}.txt`, context);

      resolve()
    })

    req.on('err', (e) => reject(e));
  })
}


const NovelCrawler = new Promise((resolve, reject) => {
  if(fs.readdirSync('./').indexOf('txt') < 0){
    console.log('创建txt文件夹...');
    fs.mkdir('txt');
    console.log('创建完毕');
  }

  if(fs.readdirSync(Novel.textPath).indexOf(Novel.title + '.txt') < 0){
    console.log(`创建${Novel.title}.txt文件...`);
    fs.createWriteStream(`${Novel.textPath}/${Novel.title}.txt`);
    console.log('创建完毕');
  }

  http.get(Novel.url, (req) => {
    let html = '';
    req.on('data', (data) => {
      html += data;
    })

    req.on('end', () => {
      let $ = cheerio.load(html);
      let list_a = $('#list a');
      list_a.each(function(){
        Novel.list.push(this.attribs.href);
      })
      resolve();
    })

    req.on('err', (e) => reject(e));
  })
})
.then(function(){
  console.log('开始爬取');
  promiseGetContext();
})
