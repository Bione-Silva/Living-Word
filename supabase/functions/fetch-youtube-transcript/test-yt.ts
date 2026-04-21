import { YoutubeTranscript } from "npm:youtube-transcript";
const url1 = "https://youtu.be/O0CJUppmky0";
const url2 = "https://youtu.be/svD43Hq67ag";

async function run() {
  try {
    const t1 = await YoutubeTranscript.fetchTranscript(url1);
    console.log("URL 1 success:", t1.length);
  } catch(e) { console.error("URL 1 error:", e.message); }
  
  try {
    const t2 = await YoutubeTranscript.fetchTranscript(url2, { lang: 'pt' });
    console.log("URL 2 success:", t2.length);
  } catch(e) { console.error("URL 2 error:", e.message); }
}
run();
