/**
 * Catalog constants shared by client and server.
 */

export interface BookSummary {
  id: number;
  title: string;
  author: string;
  languages: string[];
  subjects: string[];
  downloads: number;
}

export interface CatalogPage {
  page: number;
  hasNext: boolean;
  books: BookSummary[];
}

/** Genres map to Gutenberg search filters (s. = subject, bs. = bookshelf). */
export const GENRES: { label: string; topic: string }[] = [
  { label: "Adventure", topic: "s.adventure" },
  { label: "Science Fiction", topic: "bs.science fiction" },
  { label: "Mystery & Detective", topic: "s.detective" },
  { label: "Romance", topic: "s.love stories" },
  { label: "Horror & Gothic", topic: "s.horror" },
  { label: "Fantasy", topic: "s.fantasy" },
  { label: "Historical Fiction", topic: "s.historical fiction" },
  { label: "Short Stories", topic: "s.short stories" },
  { label: "Children", topic: "s.juvenile fiction" },
  { label: "Humour", topic: "s.humor" },
  { label: "Poetry", topic: "s.poetry" },
  { label: "Drama", topic: "s.drama" },
  { label: "Myths & Folklore", topic: "s.mythology" },
  { label: "Philosophy", topic: "s.philosophy" },
  { label: "History", topic: "s.history" },
  { label: "Biography", topic: "s.biography" },
  { label: "Science", topic: "s.science" },
  { label: "Travel", topic: "s.travel" },
];

export const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "nl", label: "Nederlands" },
  { code: "fi", label: "Suomi" },
  { code: "sv", label: "Svenska" },
  { code: "la", label: "Latina" },
  { code: "eo", label: "Esperanto" },
];

/** Hand-picked classics, shown on the home page without any network call. */
export const FEATURED: { id: number; title: string; author: string }[] = [
  { id: 1342, title: "Pride and Prejudice", author: "Jane Austen" },
  { id: 84, title: "Frankenstein", author: "Mary Wollstonecraft Shelley" },
  { id: 11, title: "Alice's Adventures in Wonderland", author: "Lewis Carroll" },
  { id: 1661, title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle" },
  { id: 2701, title: "Moby Dick", author: "Herman Melville" },
  { id: 345, title: "Dracula", author: "Bram Stoker" },
  { id: 174, title: "The Picture of Dorian Gray", author: "Oscar Wilde" },
  { id: 64317, title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  { id: 2554, title: "Crime and Punishment", author: "Fyodor Dostoyevsky" },
  { id: 1260, title: "Jane Eyre", author: "Charlotte Brontë" },
  { id: 35, title: "The Time Machine", author: "H. G. Wells" },
  { id: 5200, title: "Metamorphosis", author: "Franz Kafka" },
];

/** Author shortcuts for the Turkish (Vikikaynak) library. */
export const TURKISH_AUTHORS: string[] = [
  "Ömer Seyfettin",
  "Halit Ziya Uşaklıgil",
  "Hüseyin Rahmi Gürpınar",
  "Ahmet Mithat",
  "Namık Kemal",
  "Tevfik Fikret",
  "Mehmet Akif Ersoy",
  "Yunus Emre",
  "Karacaoğlan",
  "Pir Sultan Abdal",
  "Ziya Paşa",
  "Şinasi",
];
