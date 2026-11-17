// Photos for Reflect's recipes (`./recipes`), from Wikimedia Commons, each kept under its stated licence with its
// author and its page, shown as a credit on the recipe. The images are copied to web/public/food/ at 900 px wide.
export type FoodPhoto = { image: string; file: string; author: string; license: string; page: string };

export const FOOD_PHOTOS: Record<string, FoodPhoto> = {
  "baked-chicken": { image: "baked-chicken.jpg", file: "Max's_Roasted_Chicken_-_Evan_Swigart.jpg", author: "Evan Swigart from Chicago, USA", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Max%27s_Roasted_Chicken_-_Evan_Swigart.jpg" },
  "catfish": { image: "catfish.jpg", file: "Mississippi_Fried_Catfish.jpg", author: "Tallahatchie", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Mississippi_Fried_Catfish.jpg" },
  "chili": { image: "chili.jpg", file: "Bowl_of_chili.jpg", author: "Carstor", license: "CC BY-SA 2.5", page: "https://commons.wikimedia.org/wiki/File:Bowl_of_chili.jpg" },
  "coleslaw": { image: "coleslaw.jpg", file: "2015-12-20_Spitzkohlsalat_mit_Möhren_anagoria.JPG", author: "Anagoria", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:2015-12-20_Spitzkohlsalat_mit_M%C3%B6hren_anagoria.JPG" },
  "collard-greens": { image: "collard-greens.jpg", file: "Sukuma_Wiki_or_collard_greens.jpg", author: "MEvalyn", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Sukuma_Wiki_or_collard_greens.jpg" },
  "cornbread": { image: "cornbread.jpg", file: "Skillet_cornbread_(cropped).jpg", author: "Zankopedia", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Skillet_cornbread_(cropped).jpg" },
  "fried-chicken": { image: "fried-chicken.jpg", file: "Fried-Chicken-Set.jpg", author: "Evan-Amos", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Fried-Chicken-Set.jpg" },
  "gumbo": { image: "gumbo.jpg", file: "Gumbo.JPG", author: "Amadscientist", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Gumbo.JPG" },
  "jambalaya": { image: "jambalaya.jpg", file: "Homemade_Jambalaya.JPG", author: "Amadscientist", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Homemade_Jambalaya.JPG" },
  "mac-and-cheese": { image: "mac-and-cheese.jpg", file: "Original_Mac_n_Cheese_.jpg", author: "Texasfoodgawker", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Original_Mac_n_Cheese_.jpg" },
  "mashed-potatoes": { image: "mashed-potatoes.jpg", file: "Sous_vide_mashed_potatoes.jpg", author: "sousvideguy", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Sous_vide_mashed_potatoes.jpg" },
  "meatloaf": { image: "meatloaf.jpg", file: "MeatloafWithSauce.jpg", author: "Renee Comet (photographer)", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:MeatloafWithSauce.jpg" },
  "pot-roast": { image: "pot-roast.jpg", file: "American_pot_roast.jpg", author: "Mark Miller", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:American_pot_roast.jpg" },
  "red-beans": { image: "red-beans.jpg", file: "Red_beans.jpg", author: "Will7777 at en.wikipedia", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Red_beans.jpg" },
  "smothered-pork-chops": { image: "smothered-pork-chops.jpg", file: "Pork_chops_167541218.jpg", author: "penny from Oakland, California, USA", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Pork_chops_167541218.jpg" },
  "tacos": { image: "tacos.jpg", file: "001_Tacos_de_carnitas,_carne_asada_y_al_pastor.jpg", author: "Larry Miller", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:001_Tacos_de_carnitas,_carne_asada_y_al_pastor.jpg" },
};

export const photoOf = (recipe: string): FoodPhoto | undefined => FOOD_PHOTOS[recipe];
