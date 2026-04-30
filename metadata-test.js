const fetch = require("node-fetch");
const metascraper = require("metascraper")([
  require("metascraper-image")(),
  require("metascraper-description")(),
  require("metascraper-logo")(),
]);

async function getMetadata(url) {
    try {
    const res = await fetch(url);
    console.log(res);
    const html = await res.text();
    const metadata = await metascraper({ html, url });
    return {
        image: metadata.image || "",
        description: metadata.description || "",
        logo: metadata.logo || "",
    };
    } catch (e) {
    return { image: "", description: "" };
    }
}
async function test() {

    link = "https://maps.app.goo.gl/xJGE9qW2X4WeEpiH7";
    
    const meta = await getMetadata(link);
    console.log(meta);
}

test();