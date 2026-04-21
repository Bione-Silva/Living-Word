import yt from "youtube-transcript";

async function run() {
  const YoutubeTranscript = yt.YoutubeTranscript || yt.default.YoutubeTranscript || yt;
  try {
    const t1 = await YoutubeTranscript.fetchTranscript("https://youtu.be/O0CJUppmky0");
    console.log("URL 1 success segments:", t1.length);
  } catch(e) { console.error("URL 1 error:", e.message); }

  try {
    const t2 = await YoutubeTranscript.fetchTranscript("https://youtu.be/svD43Hq67ag"); // user's second url
    console.log("URL 2 success segments:", t2.length);
  } catch(e) { console.error("URL 2 error:", e.message); }
  
  try {
    const t3 = await YoutubeTranscript.fetchTranscript("https://youtu.be/svD43Hq67ag", { lang: 'pt' }); 
    console.log("URL 3 (pt) success segments:", t3.length);
  } catch(e) { console.error("URL 3 (pt) error:", e.message); }
}
run();
