const url = 'https://priumwdestycikzfcysg.supabase.co/rest/v1/materials?select=id,mode,output_sermon,output_outline,output_devotional,created_at&order=created_at.desc&limit=1';
const key = 'cTHoHWKgbS7pOwUHBYQUBJ60FNWs5FS/po/tD2L9dQOateoBWtoRH0e9qjlXC8BPm/j7YXUXulRj+Q149TYMVw==';

async function main() {
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': 'sb_publishable_4rbffmxsDVKYaJDiA85K3Q_1QBzi3gI',
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      console.log("=== LAST MATERIAL ID:", data[0].id, "===");
      console.log("=== SERMÃO ===\\n", data[0].output_sermon ? data[0].output_sermon.slice(0, 1500) + "..." : "NULL");
      console.log("=== ESBOÇO ===\\n", data[0].output_outline ? "EXISTS" : "NULL");
      console.log("=== DEVOCIONAL ===\\n", data[0].output_devotional ? "EXISTS" : "NULL");
    } else {
      console.log("No materials found.");
    }
  } catch (err) {
    console.log(err);
  }
}
main();
