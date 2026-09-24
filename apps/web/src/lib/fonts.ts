/* eslint-disable */
/**
 * Every reading font. next/font downloads them at build time and serves them
 * from this server, so readers never contact Google. Only the font the reader
 * picks is downloaded by the browser (preload is off for all of them).
 *
 * Generated list — keep in sync with FONT_CATALOG in font-catalog.ts.
 */
import {
  Alegreya, Alice, Atkinson_Hyperlegible, Bitter, Comic_Neue, Concert_One, Cormorant_Garamond, Courgette, Courier_Prime, Crimson_Pro, Dancing_Script, EB_Garamond, Fira_Code, IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Sans, Inter, JetBrains_Mono, Jost, Kanit, Lexend, Libre_Baskerville, Literata, Lora, Merriweather, Noto_Serif, Nunito, Open_Sans, PT_Serif, Philosopher, Playfair_Display, Rubik, Source_Serif_4, Space_Mono, Special_Elite, Spectral, Work_Sans,
} from "next/font/google";

const literata = Literata({ subsets: ["latin", "latin-ext"], variable: "--font-literata", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const lora = Lora({ subsets: ["latin", "latin-ext"], variable: "--font-lora", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const crimson_pro = Crimson_Pro({ subsets: ["latin", "latin-ext"], variable: "--font-crimson-pro", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const libre_baskerville = Libre_Baskerville({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-libre-baskerville", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const eb_garamond = EB_Garamond({ subsets: ["latin", "latin-ext"], variable: "--font-eb-garamond", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const merriweather = Merriweather({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-merriweather", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const playfair_display = Playfair_Display({ subsets: ["latin", "latin-ext"], variable: "--font-playfair-display", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const source_serif = Source_Serif_4({ subsets: ["latin", "latin-ext"], variable: "--font-source-serif", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const spectral = Spectral({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-spectral", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const cormorant_garamond = Cormorant_Garamond({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-cormorant-garamond", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const alegreya = Alegreya({ subsets: ["latin", "latin-ext"], variable: "--font-alegreya", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const bitter = Bitter({ subsets: ["latin", "latin-ext"], variable: "--font-bitter", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const pt_serif = PT_Serif({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-pt-serif", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const noto_serif = Noto_Serif({ subsets: ["latin", "latin-ext"], variable: "--font-noto-serif", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const atkinson_hyperlegible = Atkinson_Hyperlegible({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-atkinson-hyperlegible", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const instrument_sans = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-instrument-sans", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const jost = Jost({ subsets: ["latin", "latin-ext"], variable: "--font-jost", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const nunito = Nunito({ subsets: ["latin", "latin-ext"], variable: "--font-nunito", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const work_sans = Work_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-work-sans", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const lexend = Lexend({ subsets: ["latin", "latin-ext"], variable: "--font-lexend", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const rubik = Rubik({ subsets: ["latin", "latin-ext"], variable: "--font-rubik", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const ibm_plex_sans = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-ibm-plex-sans", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const open_sans = Open_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-open-sans", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const kanit = Kanit({ subsets: ["latin", "latin-ext"], weight: ["400", "600"], variable: "--font-kanit", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const philosopher = Philosopher({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-philosopher", display: "swap", preload: false, fallback: ["system-ui", "sans-serif"] });
const jetbrains_mono = JetBrains_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-jetbrains-mono", display: "swap", preload: false, fallback: ["ui-monospace", "monospace"] });
const fira_code = Fira_Code({ subsets: ["latin", "latin-ext"], variable: "--font-fira-code", display: "swap", preload: false, fallback: ["ui-monospace", "monospace"] });
const courier_prime = Courier_Prime({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-courier-prime", display: "swap", preload: false, fallback: ["ui-monospace", "monospace"] });
const ibm_plex_mono = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-ibm-plex-mono", display: "swap", preload: false, fallback: ["ui-monospace", "monospace"] });
const space_mono = Space_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "700"], variable: "--font-space-mono", display: "swap", preload: false, fallback: ["ui-monospace", "monospace"] });
const special_elite = Special_Elite({ subsets: ["latin"], weight: ["400"], variable: "--font-special-elite", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const courgette = Courgette({ subsets: ["latin", "latin-ext"], weight: ["400"], variable: "--font-courgette", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const dancing_script = Dancing_Script({ subsets: ["latin", "latin-ext"], variable: "--font-dancing-script", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const comic_neue = Comic_Neue({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-comic-neue", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const alice = Alice({ subsets: ["latin", "latin-ext"], weight: ["400"], variable: "--font-alice", display: "swap", preload: false, fallback: ["Georgia", "serif"] });
const concert_one = Concert_One({ subsets: ["latin", "latin-ext"], weight: ["400"], variable: "--font-concert-one", display: "swap", preload: false, fallback: ["Georgia", "serif"] });

/** All font CSS-variable classes, applied once on <html>. */
export const fontVariables = [literata.variable, lora.variable, crimson_pro.variable, libre_baskerville.variable, eb_garamond.variable, merriweather.variable, playfair_display.variable, source_serif.variable, spectral.variable, cormorant_garamond.variable, alegreya.variable, bitter.variable, pt_serif.variable, noto_serif.variable, inter.variable, atkinson_hyperlegible.variable, instrument_sans.variable, jost.variable, nunito.variable, work_sans.variable, lexend.variable, rubik.variable, ibm_plex_sans.variable, open_sans.variable, kanit.variable, philosopher.variable, jetbrains_mono.variable, fira_code.variable, courier_prime.variable, ibm_plex_mono.variable, space_mono.variable, special_elite.variable, courgette.variable, dancing_script.variable, comic_neue.variable, alice.variable, concert_one.variable].join(" ");
