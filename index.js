import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();


const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // WARNING: Disables SSL certificate verification
});









const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);




async function scapeWebpage(url = '') {
  const { data } = await axios.get(url, { httpsAgent });
  const $ = cheerio.load(data);

  const pageHead = $('head').html();
  const pageBody = $('body').html();

  const internallinks=[];
  const externallinks=[];

//   console.log(pageHead);
//   console.log(pageBody);

  $('a').each((index, el)=>{
    const link=$(el).attr('href');

    if(link==='/') return;

    if(link.startsWith('http')|| link.startsWith('https')){
        externallinks.push(link);
    }
    else{
        internallinks.push(link);
    }
    // console.log(externallinks);
    // console.log(internallinks);
    })
    return {
        head:pageHead,
        body:pageBody,
        internallinks,
        externallinks,
    }


    // gemini model 

    async function generateVectorEmbedding(text) {
        const embedding = await genAI.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
          encoding_format: "float",
        });
      
        return embedding.data[0].embedding;
      }

    
}

scapeWebpage('https://piyushgarg.dev').then(console.log);;
