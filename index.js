import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChromaClient } from 'chromadb';

dotenv.config();

// to run a docker container- docker compose up
// to run a docker container in background- docker compose up -d

const chromaClient = new ChromaClient({path: 'http://localhost:8000'});
chromaClient.heartbeat();


const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // WARNING: Disables SSL certificate verification
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// inserting into vector database
const WEB_COLLECTION='WEB_SCAPED_DATA_COLLECTION-1';



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

      async function ingest(url=''){
        const {head,body,internallinks}=await scapeWebpage(url);
        const bodyChunks=chunkText(body,2000);

        const headEmbedding=await generateVectorEmbedding({text:head});


        for (const chunk of bodyChunks){
            const bodyEmbedding=await generateVectorEmbedding({text:chunk});
        }

      }

    
}

scapeWebpage('https://piyushgarg.dev').then(console.log);;


function chunkText(text,chunkSize){
  if(!text || chunkSize<=0){
    return [];
  }

  const words=text.split('/\s+/');
  const chunks=[];

  for(let i=0;i<words.length;i+=chunkSize){
    chunks.push(words.slice(i,i+chunkSize).join(' '));
  }
  return chunks;
}