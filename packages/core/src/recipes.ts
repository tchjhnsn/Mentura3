// Food's recipes and whole meals (doc "Food design guide", 2026-11-17). Reflect's own recipes for well-known dishes,
// written for Reflect, grouped by where they come from; a whole meal is a main and its sides. Preferences come from a
// few questions answered with taps; a week is planned from them. Old public-domain cookbooks are listed as cookbooks to
// read, with their sources; no recipe here is said to be from one.
import { parseIngredients, type Ingredient } from "./meals.ts";

export type Region = "south" | "creole" | "tex-mex" | "midwest" | "everyday";
export type Course = "main" | "side" | "bread";
/** What a recipe holds, for what a person will not eat, and how it suits how they eat. */
export type Tag = "meat" | "pork" | "shellfish" | "fish" | "dairy" | "nuts" | "gluten" | "lower-carb" | "higher-carb";
export type Recipe = { id: string; name: string; region: Region; course: Course; minutes: number; serves: number; tags: readonly Tag[]; ingredients: string; steps: readonly string[]; goesWith?: readonly string[] };
export type WholeMeal = { id: string; name: string; main: string; sides: readonly string[] };

export const REGIONS: readonly { id: Region; label: string }[] = [
  { id: "south", label: "The South" }, { id: "creole", label: "Creole and Cajun" }, { id: "tex-mex", label: "Tex-Mex" }, { id: "midwest", label: "The Midwest" }, { id: "everyday", label: "Everyday" },
];

const R = (id: string, name: string, region: Region, course: Course, minutes: number, serves: number, tags: Tag[], ingredients: string, steps: string[], goesWith?: string[]): Recipe =>
  ({ id, name, region, course, minutes, serves, tags, ingredients, steps, ...(goesWith ? { goesWith } : {}) });

export const RECIPES: readonly Recipe[] = [
  R("fried-chicken", "Fried chicken", "south", "main", 75, 4, ["meat", "gluten", "dairy"], "3 pounds chicken pieces\n2 cups buttermilk\n2 cups flour\n2 teaspoons salt\n1 teaspoon black pepper\n1 teaspoon paprika\n4 cups oil", ["Soak the chicken in the buttermilk for at least an hour.", "Mix the flour, salt, pepper and paprika.", "Heat the oil to 350°F in a deep, heavy pan.", "Coat each piece in the flour and fry 12 to 15 minutes, turning once, until it reaches 165°F inside.", "Drain on a rack."], ["collard-greens", "candied-yams", "cornbread"]),
  R("baked-chicken", "Baked chicken", "south", "main", 60, 4, ["meat", "lower-carb"], "3 pounds chicken pieces\n2 tablespoons oil\n1 teaspoon salt\n1 teaspoon garlic powder\n1 teaspoon paprika\n½ teaspoon black pepper", ["Heat the oven to 425°F.", "Rub the chicken with the oil and spices.", "Bake skin up 40 to 45 minutes, until it reaches 165°F inside."], ["green-beans", "mac-and-cheese", "cornbread"]),
  R("smothered-pork-chops", "Smothered pork chops", "south", "main", 50, 4, ["meat", "pork", "gluten"], "4 pork chops\n1 onion\n3 tablespoons flour\n2 cups chicken broth\n1 teaspoon salt\n½ teaspoon black pepper\n2 tablespoons oil", ["Season and brown the chops in the oil; set them aside.", "Soften the sliced onion in the pan, stir in the flour, then the broth.", "Return the chops, cover and simmer 25 minutes."], ["rice", "green-beans", "cornbread"]),
  R("catfish", "Cornmeal catfish", "south", "main", 30, 4, ["fish"], "4 catfish fillets\n1 cup cornmeal\n1 teaspoon salt\n1 teaspoon black pepper\n2 cups oil", ["Season the fillets and coat them in cornmeal.", "Fry in hot oil 3 to 4 minutes a side until golden."], ["collard-greens", "coleslaw", "cornbread"]),
  R("collard-greens", "Collard greens", "south", "side", 90, 4, ["meat", "pork", "lower-carb"], "2 bunches collard greens\n1 smoked ham hock\n1 onion\n4 cups chicken broth\n1 tablespoon vinegar\n1 teaspoon salt", ["Simmer the ham hock in the broth for an hour.", "Wash, stem and cut the greens.", "Add the greens and chopped onion; simmer 30 minutes more.", "Stir in the vinegar and salt."]),
  R("candied-yams", "Candied yams", "south", "side", 60, 4, ["dairy", "higher-carb"], "3 sweet potatoes\n½ cup brown sugar\n4 tablespoons butter\n1 teaspoon cinnamon", ["Heat the oven to 375°F.", "Peel and slice the sweet potatoes.", "Melt the butter with the sugar and cinnamon and pour it over.", "Bake covered 40 minutes, then uncovered 15."]),
  R("cornbread", "Cornbread", "south", "bread", 35, 8, ["dairy", "gluten", "higher-carb"], "1 cup cornmeal\n1 cup flour\n1 tablespoon baking powder\n1 teaspoon salt\n1 cup buttermilk\n2 eggs\n4 tablespoons butter", ["Heat the oven to 425°F with a buttered skillet inside.", "Mix the dry things, then the wet, and stir together.", "Pour into the hot skillet and bake 20 minutes."]),
  R("mac-and-cheese", "Baked macaroni and cheese", "south", "side", 50, 6, ["dairy", "gluten", "higher-carb"], "1 pound elbow macaroni\n3 cups cheddar cheese\n2 cups milk\n2 eggs\n4 tablespoons butter\n1 teaspoon salt", ["Heat the oven to 350°F.", "Boil the macaroni until just tender and drain.", "Mix in the butter, milk, eggs, salt and most of the cheese.", "Top with the rest of the cheese and bake 30 minutes."]),
  R("green-beans", "Southern green beans", "south", "side", 45, 4, ["meat", "pork", "lower-carb"], "2 pounds green beans\n4 slices bacon\n1 onion\n2 cups chicken broth\n1 teaspoon salt", ["Cook the chopped bacon and onion until soft.", "Add the beans and broth and simmer 30 minutes."]),
  R("coleslaw", "Coleslaw", "south", "side", 15, 6, ["lower-carb"], "1 head cabbage\n2 carrots\n¾ cup mayonnaise\n1 tablespoon vinegar\n1 teaspoon sugar\n½ teaspoon salt", ["Shred the cabbage and carrots.", "Stir together the mayonnaise, vinegar, sugar and salt, and toss."]),
  R("red-beans", "Red beans and rice", "creole", "main", 180, 6, ["meat", "pork", "higher-carb"], "1 pound dried red beans\n1 pound smoked sausage\n1 onion\n1 green bell pepper\n2 celery stalks\n3 cloves garlic\n2 bay leaves\n8 cups water", ["Soak the beans overnight and drain.", "Brown the sliced sausage; soften the onion, pepper, celery and garlic in the fat.", "Add the beans, bay leaves and water and simmer 2 to 3 hours, mashing some beans to thicken.", "Serve over rice."], ["rice", "cornbread"]),
  R("gumbo", "Chicken and sausage gumbo", "creole", "main", 150, 8, ["meat", "pork", "gluten"], "½ cup oil\n½ cup flour\n1 onion\n1 green bell pepper\n2 celery stalks\n3 cloves garlic\n8 cups chicken broth\n2 pounds chicken thighs\n1 pound andouille sausage\n2 bay leaves", ["Stir the oil and flour over medium heat for 30 to 40 minutes, until the roux is dark brown.", "Add the chopped onion, pepper and celery, then the garlic.", "Whisk in the broth; add the chicken, sliced sausage and bay leaves.", "Simmer an hour; pull the chicken from the bones and return it.", "Serve over rice."], ["rice"]),
  R("shrimp-gumbo", "Shrimp and okra gumbo", "creole", "main", 120, 6, ["shellfish", "gluten"], "½ cup oil\n½ cup flour\n1 onion\n1 green bell pepper\n2 celery stalks\n1 pound okra\n6 cups seafood broth\n2 pounds shrimp", ["Make a dark roux of the oil and flour.", "Add the chopped vegetables and okra and cook 10 minutes.", "Add the broth and simmer 45 minutes.", "Add the shrimp for the last 5 minutes.", "Serve over rice."], ["rice"]),
  R("jambalaya", "Jambalaya", "creole", "main", 60, 6, ["meat", "pork", "higher-carb"], "1 pound andouille sausage\n1 pound chicken thighs\n1 onion\n1 green bell pepper\n2 celery stalks\n2 cups rice\n4 cups chicken broth\n1 can diced tomatoes\n1 teaspoon Cajun seasoning", ["Brown the sausage and chicken.", "Soften the chopped vegetables in the pan.", "Add the rice, broth, tomatoes and seasoning; cover and simmer 25 minutes."], ["green-beans"]),
  R("rice", "White rice", "everyday", "side", 25, 4, ["higher-carb"], "2 cups rice\n3 cups water\n1 teaspoon salt", ["Bring the water and salt to a boil, add the rice, cover and simmer 18 minutes.", "Rest 5 minutes and fluff."]),
  R("chili", "Beef chili", "tex-mex", "main", 90, 6, ["meat"], "2 pounds ground beef\n1 onion\n3 cloves garlic\n2 cans kidney beans\n1 can crushed tomatoes\n3 tablespoons chili powder\n1 teaspoon cumin\n1 teaspoon salt", ["Brown the beef with the onion and garlic.", "Add the rest and simmer an hour."], ["cornbread"]),
  R("tacos", "Beef tacos", "tex-mex", "main", 30, 4, ["meat", "dairy"], "1 pound ground beef\n8 corn tortillas\n1 tablespoon chili powder\n1 teaspoon cumin\n1 cup cheddar cheese\n1 head lettuce\n2 tomatoes", ["Brown the beef with the spices.", "Warm the tortillas.", "Fill with beef, cheese, lettuce and tomato."], ["pinto-beans"]),
  R("pinto-beans", "Pinto beans", "tex-mex", "side", 120, 6, ["higher-carb"], "1 pound dried pinto beans\n1 onion\n2 cloves garlic\n1 teaspoon cumin\n8 cups water\n1 teaspoon salt", ["Soak the beans overnight and drain.", "Simmer everything 2 hours, until soft."]),
  R("pot-roast", "Pot roast", "midwest", "main", 210, 6, ["meat", "lower-carb"], "3 pounds beef chuck roast\n1 onion\n4 carrots\n4 potatoes\n2 cups beef broth\n1 teaspoon salt\n1 teaspoon black pepper", ["Heat the oven to 300°F.", "Season and brown the roast in a heavy pot.", "Add the broth and onion, cover and roast 2½ hours.", "Add the carrots and potatoes for the last hour."], ["green-beans"]),
  R("meatloaf", "Meatloaf", "midwest", "main", 75, 6, ["meat", "gluten", "dairy"], "2 pounds ground beef\n1 onion\n2 eggs\n1 cup breadcrumbs\n½ cup milk\n½ cup ketchup\n1 teaspoon salt", ["Heat the oven to 350°F.", "Mix everything but the ketchup and shape a loaf.", "Spread the ketchup on top and bake an hour."], ["green-beans", "mashed-potatoes"]),
  R("mashed-potatoes", "Mashed potatoes", "midwest", "side", 30, 6, ["dairy", "higher-carb"], "3 pounds potatoes\n4 tablespoons butter\n¾ cup milk\n1 teaspoon salt", ["Boil the peeled potatoes until tender and drain.", "Mash with the butter, milk and salt."]),
  R("veg-chili", "Bean and vegetable chili", "everyday", "main", 60, 6, ["higher-carb"], "2 cans black beans\n1 can kidney beans\n1 onion\n1 green bell pepper\n2 carrots\n1 can crushed tomatoes\n2 tablespoons chili powder\n1 teaspoon cumin", ["Soften the chopped vegetables.", "Add the rest and simmer 40 minutes."], ["cornbread", "rice"]),
  R("sheet-pan-salmon", "Sheet-pan salmon and vegetables", "everyday", "main", 30, 4, ["fish", "lower-carb"], "4 salmon fillets\n2 heads broccoli\n2 tablespoons oil\n1 lemon\n1 teaspoon salt", ["Heat the oven to 425°F.", "Toss the broccoli in oil and salt on a sheet pan and roast 10 minutes.", "Add the salmon, season, and roast 12 minutes more. Finish with lemon."]),
];

export const WHOLE_MEALS: readonly WholeMeal[] = [
  { id: "sunday-chicken", name: "Fried chicken dinner", main: "fried-chicken", sides: ["collard-greens", "candied-yams", "cornbread"] },
  { id: "baked-chicken-dinner", name: "Baked chicken dinner", main: "baked-chicken", sides: ["green-beans", "mac-and-cheese"] },
  { id: "pork-chop-dinner", name: "Smothered pork chops", main: "smothered-pork-chops", sides: ["rice", "green-beans"] },
  { id: "fish-fry", name: "Catfish supper", main: "catfish", sides: ["coleslaw", "cornbread"] },
  { id: "red-beans-monday", name: "Red beans and rice", main: "red-beans", sides: ["rice", "cornbread"] },
  { id: "gumbo-night", name: "Chicken and sausage gumbo", main: "gumbo", sides: ["rice"] },
  { id: "shrimp-gumbo-night", name: "Shrimp and okra gumbo", main: "shrimp-gumbo", sides: ["rice"] },
  { id: "jambalaya-night", name: "Jambalaya", main: "jambalaya", sides: ["green-beans"] },
  { id: "chili-night", name: "Beef chili and cornbread", main: "chili", sides: ["cornbread"] },
  { id: "taco-night", name: "Taco night", main: "tacos", sides: ["pinto-beans"] },
  { id: "pot-roast-dinner", name: "Pot roast", main: "pot-roast", sides: ["green-beans"] },
  { id: "meatloaf-dinner", name: "Meatloaf dinner", main: "meatloaf", sides: ["mashed-potatoes", "green-beans"] },
  { id: "veg-chili-night", name: "Bean and vegetable chili", main: "veg-chili", sides: ["cornbread"] },
  { id: "salmon-night", name: "Sheet-pan salmon", main: "sheet-pan-salmon", sides: ["rice"] },
];

/** Old cookbooks in the public domain, to read in full where they are kept. */
export const COOKBOOKS: readonly { id: string; title: string; author: string; year: number; region: Region; url: string; where: string }[] = [
  { id: "fisher", title: "What Mrs. Fisher Knows About Old Southern Cooking", author: "Abby Fisher", year: 1881, region: "south", url: "https://www.loc.gov/item/08023680/", where: "Library of Congress" },
  { id: "la-cuisine-creole", title: "La Cuisine Creole", author: "Lafcadio Hearn", year: 1885, region: "creole", url: "https://www.gutenberg.org/ebooks/75027", where: "Project Gutenberg" },
  { id: "old-south", title: "Dishes & Beverages of the Old South", author: "Martha McCulloch-Williams", year: 1913, region: "south", url: "https://www.gutenberg.org/ebooks/28491", where: "Project Gutenberg" },
];

export const recipeOf = (id: string) => RECIPES.find((r) => r.id === id);
export const wholeMealOf = (id: string) => WHOLE_MEALS.find((m) => m.id === id);
export const ingredientsOf = (r: Recipe): Ingredient[] => parseIngredients(r.ingredients);
/** A whole meal's recipes, main first. */
export const recipesOfMeal = (m: WholeMeal): Recipe[] => [m.main, ...m.sides].map(recipeOf).filter((r): r is Recipe => Boolean(r));

/** How a person likes to eat, from Food's first questions. Every answer is optional. */
export type Likes = { eat?: "any" | "lower-carb" | "higher-carb" | "vegetarian" | "no-pork"; avoid?: readonly Tag[]; region?: Region; nights?: number; cooking?: "love" | "fine" | "rather-not"; /** Hours a week the person gives to cooking. */ hours?: number };

export const QUESTIONS = [
  { key: "eat", label: "How do you like to eat?", options: [["any", "No preference"], ["lower-carb", "Lower carb"], ["higher-carb", "Higher carb"], ["vegetarian", "Vegetarian"], ["no-pork", "No pork"]] },
  { key: "region", label: "What food did you grow up on?", options: REGIONS.map((r) => [r.id, r.label]) },
  { key: "avoid", label: "Anything you will not eat?", many: true, options: [["shellfish", "Shellfish"], ["fish", "Fish"], ["dairy", "Dairy"], ["nuts", "Nuts"], ["gluten", "Gluten"], ["pork", "Pork"]] },
  { key: "nights", label: "How many nights a week do you cook?", options: [["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "Every night"]] },
  { key: "hours", label: "How many hours a week do you want to spend cooking?", options: [["1", "About an hour"], ["2", "2 hours"], ["3", "3 hours"], ["5", "5 hours"], ["7", "7 hours"], ["10", "10 hours or more"]] },
] as const;

/** Whether a recipe fits what the person will and will not eat. */
export function fits(r: Recipe, l: Likes): boolean {
  const avoid = new Set<Tag>(l.avoid ?? []);
  if (l.eat === "vegetarian") { avoid.add("meat"); avoid.add("pork"); avoid.add("fish"); avoid.add("shellfish"); }
  if (l.eat === "no-pork") avoid.add("pork");
  return !r.tags.some((t) => avoid.has(t));
}

/** A whole meal fits when its main does; sides that do not fit are left off. */
export function fitMeal(m: WholeMeal, l: Likes): WholeMeal | null {
  const main = recipeOf(m.main);
  if (!main || !fits(main, l)) return null;
  return { ...m, sides: m.sides.filter((s) => { const r = recipeOf(s); return r ? fits(r, l) : false; }) };
}

/** How long a whole meal takes: its longest recipe, since sides cook beside the main. */
export const mealMinutes = (m: WholeMeal): number => Math.max(...recipesOfMeal(m).map((r) => r.minutes));
/** The minutes a night the person's cooking hours allow, or null when they have not said. */
export const minutesPerNight = (l: Likes): number | null => (l.hours ? Math.round((l.hours * 60) / Math.min(7, Math.max(1, l.nights ?? 5))) : null);

const score = (m: WholeMeal, l: Likes) => {
  const main = recipeOf(m.main)!;
  let s = 0;
  if (l.region && main.region === l.region) s += 3;
  if (l.eat === "lower-carb" && main.tags.includes("lower-carb")) s += 2;
  if (l.eat === "higher-carb" && main.tags.includes("higher-carb")) s += 2;
  if (l.cooking === "rather-not") s += main.minutes <= 45 ? 2 : -1;
  const cap = minutesPerNight(l);
  if (cap !== null) s += mealMinutes(m) <= cap ? 2 : -4;
  return s;
};

/**
 * A week of whole meals for the nights the person cooks: meals that fit, those closest to how they like to eat first,
 * turned by the week so two weeks do not repeat in the same order. Deterministic for a given week.
 */
export function planWeek(l: Likes, week: readonly string[], seed = week[0] ?? ""): { day: string; meal: WholeMeal }[] {
  const nights = Math.min(7, Math.max(1, l.nights ?? 5));
  const ranked = WHOLE_MEALS.map((m) => fitMeal(m, l)).filter((m): m is WholeMeal => m !== null).sort((a, b) => score(b, l) - score(a, l) || a.id.localeCompare(b.id));
  const cap = minutesPerNight(l);
  const quick = cap === null ? ranked : ranked.filter((m) => mealMinutes(m) <= cap);
  if (quick.length) ranked.splice(0, ranked.length, ...quick);
  if (!ranked.length) return [];
  const turn = [...seed].reduce((s, c) => s + c.charCodeAt(0), 0) % ranked.length;
  const top = ranked.slice(0, Math.max(nights, Math.min(ranked.length, nights + 3)));
  const order = [...top.slice(turn % top.length), ...top.slice(0, turn % top.length)];
  return week.slice(0, nights).map((day, i) => ({ day, meal: order[i % order.length]! }));
}

/** Shelves for Discover: where the person is from first, then the other regions, each holding whole meals that fit. */
export function shelves(l: Likes): { region: Region; label: string; meals: WholeMeal[] }[] {
  const order = [...REGIONS].sort((a, b) => (a.id === l.region ? -1 : b.id === l.region ? 1 : 0));
  return order.map((r) => ({ region: r.id, label: r.label, meals: WHOLE_MEALS.filter((m) => recipeOf(m.main)?.region === r.id).map((m) => fitMeal(m, l)).filter((m): m is WholeMeal => m !== null) })).filter((s) => s.meals.length);
}

const AISLES: readonly [string, RegExp][] = [
  ["Produce", /greens|collard|onion|bell pepper|celery|garlic|potato|yam|carrot|cabbage|lettuce|tomato|okra|broccoli|lemon|green beans/],
  ["Meat and seafood", /chicken|pork|beef|sausage|andouille|ham|bacon|shrimp|catfish|salmon|roast/],
  ["Dairy and eggs", /milk|buttermilk|butter|cheese|cheddar|egg/],
  ["Breads", /tortilla|breadcrumb/],
];
/** The store aisle an item is usually found in, from its name; the pantry otherwise. */
export function aisleOf(name: string): string {
  const n = name.toLowerCase();
  if (/^cans? |canned|broth|dried|^rice$|flour|cornmeal|macaroni|sugar|^salt$|black pepper|paprika|cumin|powder|seasoning|cinnamon|^oil$|vinegar|ketchup|mayonnaise|bay leaves|crushed tomatoes|diced tomatoes|kidney beans|black beans/.test(n)) return "Pantry";
  return AISLES.find(([, re]) => re.test(n))?.[0] ?? "Pantry";
}

/** Meal plans to start from Discover: a week of whole meals, put on the week's open days in order. */
export const MEAL_PLANS: readonly { id: string; name: string; about: string; meals: readonly string[] }[] = [
  { id: "southern-week", name: "A Southern week", about: "5 dinners, whole meals", meals: ["sunday-chicken", "red-beans-monday", "baked-chicken-dinner", "fish-fry", "pork-chop-dinner"] },
  { id: "creole-week", name: "A Creole week", about: "4 dinners from New Orleans", meals: ["red-beans-monday", "gumbo-night", "jambalaya-night", "shrimp-gumbo-night"] },
  { id: "lower-carb-southern", name: "Lower carb, Southern", about: "4 dinners", meals: ["baked-chicken-dinner", "pot-roast-dinner", "salmon-night", "fish-fry"] },
  { id: "quick-weeknights", name: "Quick weeknights", about: "Dinners in about 35 minutes", meals: ["fish-fry", "salmon-night", "taco-night"] },
];
export const mealPlanOf = (id: string) => MEAL_PLANS.find((p) => p.id === id);
