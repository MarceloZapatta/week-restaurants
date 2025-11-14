(() => {
  const links = document.querySelectorAll("a.hfpxzc");
  const restaurants = [];

  links.forEach((link) => {
    const href = link.getAttribute("href");
    let name = link.getAttribute("aria-label");
    restaurants.push({ name, link: href });
  });
  // Remove duplicates by link
  const unique = Array.from(
    new Map(restaurants.map((r) => [r.link, r])).values()
  );
  // Prepare CSV
  const csvRows = ["Name;link", ...unique.map((r) => `${r.name};${r.link}`)];
  console.log(csvRows.join("\n"));
})();
