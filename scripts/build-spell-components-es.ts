/**
 * Genera traducciones ES de componentes materiales de conjuros SRD.
 * Fuente: texto M(...) en spell-meta.json (inglés).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metaPath = path.join(root, "src", "data", "srd", "spell-meta.json");
const outPath = path.join(root, "src", "data", "i18n", "spell-components-es.json");

/** Traducciones literales de frases de material SRD 2024. */
const MATERIAL_ES: Record<string, string> = {
  "1 Copper Piece": "1 pieza de cobre",
  "2 Copper Pieces, which the spell consumes": "2 piezas de cobre, que el conjuro consume",
  "a Holy Symbol worth 5+ GP": "un símbolo sagrado por valor de 5+ PO",
  "a ball of bat guano and sulfur": "una bola de guano de murciélago y azufre",
  "a ball of wax": "una bola de cera",
  "a bell and silver wire": "una campana y hilo de plata",
  "a bit of bat fur": "un poco de pelo de murciélago",
  "a bit of fleece": "un poco de lana",
  "a bit of fur and a crystal rod": "un poco de pelo y una vara de cristal",
  "a bit of gauze": "un poco de gasa",
  "a bit of phosphorus": "un poco de fósforo",
  "a bit of phosphorus or a firefly": "un poco de fósforo o una luciérnaga",
  "a bit of pork rind or butter": "un poco de corteza de cerdo o mantequilla",
  "a bit of spiderweb": "un poco de telaraña",
  "a bit of string and of wood": "un poco de cuerda y de madera",
  "a candle": "una vela",
  "a caterpillar cocoon": "un capullo de oruga",
  "a chest, 3 feet by 2 feet by 2 feet, constructed from rare materials worth 5,000+ GP, and a Tiny replica of the chest made from the same materials worth 50+ GP":
    "un cofre de 3×2×2 pies, construido con materiales raros por valor de 5.000+ PO, y una réplica diminuta del cofre hecha con los mismos materiales por valor de 50+ PO",
  "a chip of mica": "un trozo de mica",
  "a cockatrice feather": "una pluma de cocatriz",
  "a copper wire": "un hilo de cobre",
  "a crystal bead": "una cuenta de cristal",
  "a cube of granite": "un cubo de granito",
  "a diamond worth 1,000+ GP, which the spell consumes": "un diamante por valor de 1.000+ PO, que el conjuro consume",
  "a diamond worth 1,000+ GP, which the spell consumes, and a sealable vessel worth 2,000+ GP that is large enough to hold the creature being cloned":
    "un diamante por valor de 1.000+ PO, que el conjuro consume, y un recipiente sellable por valor de 2.000+ PO lo bastante grande para albergar a la criatura clonada",
  "a diamond worth 300+ GP, which the spell consumes": "un diamante por valor de 300+ PO, que el conjuro consume",
  "a diamond worth 5,000+ GP": "un diamante por valor de 5.000+ PO",
  "a diamond worth 50+ GP": "un diamante por valor de 50+ PO",
  "a diamond worth 500+ GP, which the spell consumes": "un diamante por valor de 500+ PO, que el conjuro consume",
  "a dried carrot": "una zanahoria seca",
  "a drop of alcohol": "una gota de alcohol",
  "a drop of bile": "una gota de bilis",
  "a drop of bitumen and a spider": "una gota de betún y una araña",
  "a drop of blood": "una gota de sangre",
  "a drop of blood, a piece of flesh, and a pinch of bone dust": "una gota de sangre, un trozo de carne y una pizca de polvo de hueso",
  "a drop of honey": "una gota de miel",
  "a drop of mercury": "una gota de mercurio",
  "a drop of mercury, a dollop of gum arabic, and a wisp of smoke": "una gota de mercurio, una porción de goma arábiga y un hilo de humo",
  "a drop of molasses": "una gota de melaza",
  "a drop of water or a piece of ice": "una gota de agua o un trozo de hielo",
  "a fan and a feather": "un abanico y una pluma",
  "a feather": "una pluma",
  "a firefly or phosphorescent moss": "una luciérnaga o musgo fosforescente",
  "a flask of Holy Water worth 25+ GP, which the spell consumes": "un frasco de agua bendita por valor de 25+ PO, que el conjuro consume",
  "a focus worth 1,000+ GP, such as a crystal ball, mirror, or water-filled font":
    "un foco por valor de 1.000+ PO, como una bola de cristal, un espejo o una pila con agua",
  "a focus worth 100+ GP, either a jeweled horn for hearing or a glass eye for seeing":
    "un foco por valor de 100+ PO, ya sea un cuerno enjoyado para oír o un ojo de cristal para ver",
  "a forked twig": "una ramita bifurcada",
  "a forked, metal rod worth 250+ GP and attuned to a plane of existence":
    "una vara metálica bifurcada por valor de 250+ PO y sintonizada con un plano de existencia",
  "a fractured rock": "una roca fracturada",
  "a gem, crystal, or reliquary worth 500+ GP": "una gema, cristal o relicario por valor de 500+ PO",
  "a gem-encrusted bowl worth 1,000+ GP, which the spell consumes": "un cuenco engastado con gemas por valor de 1.000+ PO, que el conjuro consume",
  "a gem-encrusted statuette of yourself worth 1,500+ GP": "una estatuilla tuya engastada con gemas por valor de 1.500+ PO",
  "a glass bead": "una cuenta de vidrio",
  "a glass sphere": "una esfera de vidrio",
  "a grasshopper's hind leg": "una pata trasera de saltamontes",
  "a handful of oak bark": "un puñado de corteza de roble",
  "a handful of sand": "un puñado de arena",
  "a handful of thorns": "un puñado de espinas",
  "a hot pepper": "un pimiento picante",
  "a hummingbird feather": "una pluma de colibrí",
  "a jade circlet worth 1,500+ GP": "una diadema de jade por valor de 1.500+ PO",
  "a jewel worth 1,000+ GP, which the spell consumes": "una joya por valor de 1.000+ PO, que el conjuro consume",
  "a key ring with no keys": "un llavero sin llaves",
  "a leather strap": "una correa de cuero",
  "a legume seed": "una semilla de legumbre",
  "a locust": "una langosta",
  "a lodestone and dust": "una magnetita y polvo",
  "a lodestone and iron filings": "una magnetita y limaduras de hierro",
  "a magnifying glass": "una lupa",
  "a metal spring": "un muelle metálico",
  "a miniature crystal sphere": "una esfera de cristal en miniatura",
  "a miniature door worth 15+ GP": "una puerta en miniatura por valor de 15+ PO",
  "a miniature shovel": "una pala en miniatura",
  "a miniature sword worth 250+ GP": "una espada en miniatura por valor de 250+ PO",
  "a miniature umbrella": "un paraguas en miniatura",
  "a miniature ziggurat": "un zigurat en miniatura",
  "a mitten": "un manopla",
  "a mix of vinegar and honey": "una mezcla de vinagre y miel",
  "a mix of water and sand": "una mezcla de agua y arena",
  "a mixture of water and dust": "una mezcla de agua y polvo",
  "a moonseed leaf": "una hoja de moonseed",
  "a morsel of food": "un bocado de comida",
  "a mushroom": "un hongo",
  "a paintbrush": "un pincel",
  "a pair of platinum rings worth 50+ GP each, which you and the target must wear for the duration":
    "un par de anillos de platino por valor de 50+ PO cada uno, que tú y el objetivo debéis llevar durante la duración",
  "a pearl worth 100+ GP": "una perla por valor de 100+ PO",
  "a pentacle": "un pentáculo",
  "a piece of charcoal": "un trozo de carbón",
  "a piece of cork": "un trozo de corcho",
  "a piece of cured leather": "un trozo de cuero curtido",
  "a piece of iron and a flame": "un trozo de hierro y una llama",
  "a piece of quartz": "un trozo de cuarzo",
  "a piece of sunstone": "un trozo de piedra solar",
  "a pinch of colorful sand": "una pizca de arena de colores",
  "a pinch of confetti": "una pizca de confeti",
  "a pinch of diamond dust worth 25+ GP, which the spell consumes": "una pizca de polvo de diamante por valor de 25+ PO, que el conjuro consume",
  "a pinch of dirt": "una pizca de tierra",
  "a pinch of powdered iron": "una pizca de hierro en polvo",
  "a pinch of sand or rose petals": "una pizca de arena o pétalos de rosa",
  "a pinch of sesame seeds": "una pizca de semillas de sésamo",
  "a pinch of soot and salt": "una pizca de hollín y sal",
  "a pinch of sulfur": "una pizca de azufre",
  "a pinch of talc": "una pizca de talco",
  "a prayer scroll": "un pergamino de oración",
  "a prayer wheel": "una rueda de oración",
  "a reliquary worth 1,000+ GP": "un relicario por valor de 1.000+ PO",
  "a rotten egg": "un huevo podrido",
  "a sapphire worth 1,000+ GP": "un zafiro por valor de 1.000+ PO",
  "a segment of rope": "un trozo de cuerda",
  "a set of divination tools—such as cards or runes—worth 100+ GP": "un juego de herramientas de adivinación —como cartas o runas— por valor de 100+ PO",
  "a shard of glass": "un fragmento de vidrio",
  "a shard of glass from a mirror": "un fragmento de vidrio de un espejo",
  "a shaving of licorice root": "una viruta de raíz de regaliz",
  "a short reed": "una caña corta",
  "a silver rod worth 10+ GP": "una vara de plata por valor de 10+ PO",
  "a silver whistle": "un silbato de plata",
  "a small crystal or glass cone": "un cono pequeño de cristal o vidrio",
  "a small feather or piece of down": "una pluma pequeña o un poco de plumón",
  "a small square of silk": "un pequeño trozo de seda",
  "a snake's tongue": "la lengua de una serpiente",
  "a sprig of mistletoe": "un ramito de muérdago",
  "a statuette of the target worth 5,000+ GP": "una estatuilla del objetivo por valor de 5.000+ PO",
  "a statuette of yourself worth 5+ GP": "una estatuilla tuya por valor de 5+ PO",
  "a straight piece of iron": "un trozo recto de hierro",
  "a strip of white cloth": "una tira de tela blanca",
  "a sumac leaf": "una hoja de zumaque",
  "a tart and a feather": "una tarta y una pluma",
  "a tentacle": "un tentáculo",
  "a thin sheet of lead": "una lámina fina de plomo",
  "a weapon with which you have proficiency and that is worth 1+ CP":
    "un arma con la que tengas competencia y que valga 1+ PC",
  "a white feather": "una pluma blanca",
  "a yew leaf": "una hoja de tejo",
  "an agate worth 1,000+ GP, which the spell consumes": "un ágata por valor de 1.000+ PO, que el conjuro consume",
  "an eggshell and a glove": "una cáscara de huevo y un guante",
  "an eyelash in gum arabic": "una pestaña en goma arábiga",
  "an object with the image of a dragon engraved on it worth 500+ GP":
    "un objeto con la imagen de un dragón grabada por valor de 500+ PO",
  "ashes from burned mistletoe": "cenizas de muérdago quemado",
  "bat fur and a piece of coal": "pelo de murciélago y un trozo de carbón",
  "burning incense": "incienso ardiendo",
  "burning incense worth 10+ GP, which the spell consumes": "incienso ardiendo por valor de 10+ PO, que el conjuro consume",
  "diamond dust worth 100+ GP, which the spell consumes": "polvo de diamante por valor de 100+ PO, que el conjuro consume",
  "diamonds worth 25,000+ GP, which the spell consumes": "diamantes por valor de 25.000+ PO, que el conjuro consume",
  "for each of the spell's targets, one jacinth worth 1,000+ GP and one silver bar worth 100+ GP, all of which the spell consumes":
    "por cada objetivo del conjuro, un jacinto por valor de 1.000+ PO y una barra de plata por valor de 100+ PO, que el conjuro consume",
  "fur from a bloodhound": "pelo de sabueso",
  "fur or a feather": "pelo o una pluma",
  "gem dust worth 5,000+ GP, which the spell consumes": "polvo de gema por valor de 5.000+ PO, que el conjuro consume",
  "gold dust worth 25+ GP, which the spell consumes": "polvo de oro por valor de 25+ PO, que el conjuro consume",
  incense: "incienso",
  "incense worth 1,000+ GP, which the spell consumes": "incienso por valor de 1.000+ PO, que el conjuro consume",
  "incense worth 25+ GP, which the spell consumes": "incienso por valor de 25+ PO, que el conjuro consume",
  "incense worth 250+ GP, which the spell consumes, and four ivory strips worth 50+ GP each":
    "incienso por valor de 250+ PO, que el conjuro consume, y cuatro tiras de marfil por valor de 50+ PO cada una",
  "ink worth 10+ GP, which the spell consumes": "tinta por valor de 10+ PO, que el conjuro consume",
  "iron filings": "limaduras de hierro",
  "jade dust worth 10+ GP, which the spell consumes": "polvo de jade por valor de 10+ PO, que el conjuro consume",
  "jade dust worth 25+ GP": "polvo de jade por valor de 25+ PO",
  mistletoe: "muérdago",
  "mushroom powder worth 25+ GP, which the spell consumes": "polvo de hongo por valor de 25+ PO, que el conjuro consume",
  "one 150+ GP black onyx stone for each corpse": "una piedra de ónix negro por valor de 150+ PO por cada cadáver",
  "powdered diamond worth 1,000+ GP, which the spell consumes": "diamante en polvo por valor de 1.000+ PO, que el conjuro consume",
  "powdered diamond worth 200+ GP, which the spell consumes": "diamante en polvo por valor de 200+ PO, que el conjuro consume",
  "powdered rhubarb leaf": "hoja de ruibarbo en polvo",
  "powdered ruby worth 1,500+ GP, which the spell consumes": "rubí en polvo por valor de 1.500+ PO, que el conjuro consume",
  "powdered silver and iron": "plata y hierro en polvo",
  "rare inks worth 50+ GP, which the spell consumes": "tintas raras por valor de 50+ PO, que el conjuro consume",
  "rare oils worth 1,000+ GP, which the spell consumes": "aceites raros por valor de 1.000+ PO, que el conjuro consume",
  "ruby dust worth 1,000+ GP": "polvo de rubí por valor de 1.000+ PO",
  "ruby dust worth 1,500+ GP, which the spell consumes": "polvo de rubí por valor de 1.500+ PO, que el conjuro consume",
  "ruby dust worth 50+ GP, which the spell consumes": "polvo de rubí por valor de 50+ PO, que el conjuro consume",
  "salt and powdered silver worth 100+ GP, which the spell consumes": "sal y plata en polvo por valor de 100+ PO, que el conjuro consume",
  "seven thorns": "siete espinas",
  "soft clay": "arcilla blanda",
  "specially marked sticks, bones, cards, or other divinatory tokens worth 25+ GP":
    "palos, huesos, cartas u otros tokens de adivinación especialmente marcados por valor de 25+ PO",
  "the petrified eye of a newt": "el ojo petrificado de un tritón",
  "the powder of a crushed black pearl worth 500+ GP": "el polvo de una perla negra triturada por valor de 500+ PO",
  "three nut shells": "tres cáscaras de nuez",
  "three silver pins": "tres alfileres de plata",
  "two eggs": "dos huevos",
  "two lodestones": "dos magnetitas",
};

function main() {
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as Record<
    string,
    { components?: string }
  >;
  const materials = new Set<string>();
  for (const row of Object.values(meta)) {
    const m = row.components?.match(/M \((.+)\)/);
    if (m) materials.add(m[1]);
  }

  const missing: string[] = [];
  const out: Record<string, string> = {};
  for (const en of materials) {
    const es = MATERIAL_ES[en];
    if (!es) {
      missing.push(en);
      out[en] = en;
    } else {
      out[en] = es;
    }
  }

  fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        total: materials.size,
        translated: materials.size - missing.length,
        missing: missing.length,
        out: path.relative(root, outPath),
      },
      null,
      2,
    ),
  );
  if (missing.length) {
    console.warn("Sin traducción:", missing.join("\n"));
    process.exit(1);
  }
}

main();
