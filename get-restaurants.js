(() => {
  const BASE_URL = "https://www.tripadvisor.com.br";
  const cards = document.querySelectorAll('[data-automation="restaurantCard"]');
  const restaurants = [];
  cards.forEach((card) => {
    const links = Array.from(
      card.querySelectorAll('a[href^="/Restaurant_Review"]')
    );
    if (links.length >= 2) {
      let href = links[1].getAttribute("href").replace(/#REVIEWS$/, "");
      let name = card.innerText.trim().split("\n")[0].replace(/;/g, ",");
      // Remove início como '5. ' ou '12. ' etc
      name = name.replace(/^\d+\.\s*/, "");
      restaurants.push({ name, link: BASE_URL + href });
    }
  });
  // Remove duplicates by link
  const unique = Array.from(
    new Map(restaurants.map((r) => [r.link, r])).values()
  );
  // Prepare CSV
  const csvRows = ["Name;link", ...unique.map((r) => `${r.name};${r.link}`)];
  console.log(csvRows.join("\n"));
})();
