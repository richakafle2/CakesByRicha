/* ==========================================================
   Sweets Catalog — UPDATE THIS MONTHLY
   1. Drop the photo into images/references/
   2. Add an entry under the right category with a unique code.
   3. Update `month` at the top when the assortment changes.

   Each item:
     code         unique code (shows on the page, clipped into the order form)
     title        dessert name
     image        path to the photo
     notes        one-line description shown on the card
     limited      true = shows a "Limited time" badge
     sizes        size options shown under MORE INFO
     ingredients  ingredient list shown under MORE INFO
     allergens    allergen list shown under MORE INFO

   To take something off the page without deleting it, add `hidden: true`.

   NOTE: sizes, ingredients and allergens below are placeholders —
   replace them with your real recipes before publishing.
   ========================================================== */
window.CBR_CATALOG = {
  month: "October 2026",

  categories: [
    {
      id: "cookies",
      title: "Brown Butter Cookies",
      items: [
        {
          code: "REF-009",
          title: "Classic brown butter chocolate chip",
          image: "images/references/REF-009.jpg",
          notes: "Toffee-y brown butter, dark chocolate, flaky salt",
          limited: false,
          sizes: ["Half dozen", "Dozen"],
          ingredients: ["Brown butter", "Brown sugar", "Flour", "Eggs", "Dark chocolate", "Vanilla", "Flaky sea salt"],
          allergens: ["Wheat", "Dairy", "Eggs", "Soy (chocolate)"]
        },
        {
          code: "REF-010",
          title: "Cardamom pistachio brown butter",
          image: "images/references/REF-010.jpg",
          notes: "Green cardamom, toasted pistachios, white chocolate",
          limited: true,
          sizes: ["Half dozen", "Dozen"],
          ingredients: ["Brown butter", "Sugar", "Flour", "Eggs", "Pistachios", "Cardamom", "White chocolate"],
          allergens: ["Wheat", "Dairy", "Eggs", "Tree nuts (pistachio)"]
        }
      ]
    },

    {
      id: "cakes",
      title: "Cakes",
      subsections: [
        {
          id: "mini",
          title: "Mini Cakes",
          items: [
            {
              code: "REF-006",
              title: "Lavender bento",
              image: "images/references/REF-006.jpg",
              notes: "4-inch, vintage piping",
              limited: false,
              sizes: ["4-inch bento (serves 1–2)"],
              ingredients: ["Vanilla sponge", "Lavender buttercream", "Butter", "Sugar", "Eggs", "Flour", "Milk"],
              allergens: ["Wheat", "Dairy", "Eggs"]
            }
          ]
        },
        {
          id: "full",
          title: "Full-Size Cakes",
          items: [
            {
              code: "REF-001",
              title: "Blush rosette two-tier",
              image: "images/references/REF-001.jpg",
              notes: "Buttercream rosettes, ombré pink",
              limited: false,
              sizes: ["Two tier: 6\" + 8\" (serves 30–35)"],
              ingredients: ["Vanilla sponge", "Swiss meringue buttercream", "Butter", "Sugar", "Eggs", "Flour", "Milk"],
              allergens: ["Wheat", "Dairy", "Eggs"]
            },
            {
              code: "REF-002",
              title: "Gold-drip chocolate",
              image: "images/references/REF-002.jpg",
              notes: "Dark ganache drip, gold leaf",
              limited: false,
              sizes: ["6-inch (serves 8–12)", "8-inch (serves 16–20)"],
              ingredients: ["Chocolate sponge", "Chocolate buttercream", "Dark chocolate ganache", "Cream", "Edible gold leaf"],
              allergens: ["Wheat", "Dairy", "Eggs", "Soy (chocolate)"]
            },
            {
              code: "REF-003",
              title: "Pistachio-rose naked cake",
              image: "images/references/REF-003.jpg",
              notes: "Semi-naked, dried rose petals",
              limited: false,
              sizes: ["6-inch (serves 8–12)", "8-inch (serves 16–20)"],
              ingredients: ["Pistachio sponge", "Rose buttercream", "Pistachios", "Dried rose petals", "Butter", "Eggs", "Flour"],
              allergens: ["Wheat", "Dairy", "Eggs", "Tree nuts (pistachio)"]
            },
            {
              code: "REF-004",
              title: "Mango mehndi floral",
              image: "images/references/REF-004.jpg",
              notes: "Piped henna-style detail",
              limited: true,
              sizes: ["6-inch (serves 8–12)", "8-inch (serves 16–20)"],
              ingredients: ["Vanilla sponge", "Mango filling", "Buttercream", "Butter", "Sugar", "Eggs", "Flour"],
              allergens: ["Wheat", "Dairy", "Eggs"]
            },
            {
              code: "REF-005",
              title: "Classic white wedding",
              image: "images/references/REF-005.jpg",
              notes: "Three tiers, pearl border",
              limited: false,
              sizes: ["Three tier: 6\" + 8\" + 10\" (serves 70–80)"],
              ingredients: ["Vanilla sponge", "Swiss meringue buttercream", "Sugar pearls", "Butter", "Eggs", "Flour"],
              allergens: ["Wheat", "Dairy", "Eggs"]
            },
            {
              code: "REF-007",
              title: "Ras malai cheesecake",
              image: "images/references/REF-007.jpg",
              notes: "Saffron glaze, pistachio crumb",
              limited: true,
              sizes: ["6-inch (serves 8–10)", "8-inch (serves 12–16)"],
              ingredients: ["Cream cheese", "Ras malai", "Saffron", "Cardamom", "Biscuit crust", "Pistachios", "Sugar"],
              allergens: ["Wheat", "Dairy", "Eggs", "Tree nuts (pistachio)"]
            },
            {
              code: "REF-008",
              title: "Rainbow sprinkle birthday",
              image: "images/references/REF-008.jpg",
              notes: "Funfetti layers, sprinkle collar",
              limited: false,
              sizes: ["6-inch (serves 8–12)", "8-inch (serves 16–20)"],
              ingredients: ["Funfetti vanilla sponge", "Vanilla buttercream", "Rainbow sprinkles", "Butter", "Eggs", "Flour"],
              allergens: ["Wheat", "Dairy", "Eggs"]
            }
          ]
        }
      ]
    }
  ]
};

/* Flat list of every item, in the same shape as the old
   CBR_REFERENCES, so the order form's code lookup keeps working. */
window.CBR_REFERENCES = (function () {
  var out = [];
  window.CBR_CATALOG.categories.forEach(function (cat) {
    var groups = cat.subsections || [{ title: cat.title, items: cat.items || [] }];
    groups.forEach(function (sub) {
      sub.items.forEach(function (item) {
        if (item.hidden) return;
        out.push(Object.assign({ category: cat.subsections ? sub.title : cat.title }, item));
      });
    });
  });
  return out;
})();