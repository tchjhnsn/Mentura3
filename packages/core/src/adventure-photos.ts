// Photos for the Adventures board and pages, one per idea, from Wikimedia Commons (Unsplash needs a key Reflect does
// not have). Each keeps its author, licence and page, shown on the photo. Files are in web/public/adventure-photos/.
export type AdventurePhoto = { image: string; file: string; author: string; license: string; page: string };

export const ADVENTURE_PHOTOS: Record<string, AdventurePhoto> = {
  "camping": { image: "camping.jpg", file: "From the Tent (11407501624).jpg", author: "Bureau of Land Management Oregon and Washington", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:From_the_Tent_(11407501624).jpg" },
  "trail": { image: "trail.jpg", file: "Mountaineering Man Trail Path Mountains.jpg", author: "Hermann", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Mountaineering_Man_Trail_Path_Mountains.jpg" },
  "skydiving": { image: "skydiving.jpg", file: "Skydiver in Freefall Wearing Bright Green Suit.jpg", author: "Rstpch", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Skydiver_in_Freefall_Wearing_Bright_Green_Suit.jpg" },
  "abroad": { image: "abroad.jpg", file: "1000 Three domes of Oia in Santorini Photo by Giles Laurent.jpg", author: "Giles Laurent", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:1000_Three_domes_of_Oia_in_Santorini_Photo_by_Giles_Laurent.jpg" },
  "game-night": { image: "game-night.jpg", file: "Family playing a board game (2).jpg", author: "Bill Branson (Photographer)", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Family_playing_a_board_game_(2).jpg" },
  "dance": { image: "dance.jpg", file: "Vernon and Irene Castle2.jpg", author: "Johnston, Frances Benjamin, 1864-1952, photographer.", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Vernon_and_Irene_Castle2.jpg" },
  "default": { image: "default.jpg", file: "Lake Sylvester during the sunrise, Kahurangi, New Zealand.jpg", author: "Michal Klajban", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Lake_Sylvester_during_the_sunrise,_Kahurangi,_New_Zealand.jpg" },
};
