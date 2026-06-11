/**
 * Genera data/i18n/subclass-features-manual.json desde el extracto inglés.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DESCRIPTIONS_PART2, NAME_ES_PART2 } from "./subclass-features-manual-data.js";
import { DESCRIPTIONS_PART3, NAME_ES_PART3 } from "./subclass-features-manual-data-part3.js";
import { DESCRIPTIONS_PART4, NAME_ES_PART4 } from "./subclass-features-manual-data-part4.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extractPath = path.join(root, "data/i18n/_subclass-features-en-extract.json");
const outPath = path.join(root, "data/i18n/subclass-features-manual.json");

type Entry = { subclassId: string; level: number; nameEn: string; description: string };
type ManualEntry = { name?: string; description: string };

const DESCRIPTIONS_PART1: Record<string, string> = {
  "wild-heart::3::Animal Speaker":
    "Puedes lanzar los conjuros Sentido bestial y Hablar con animales, pero solo como rituales. Sabiduría es tu característica de lanzamiento de conjuros para ellos.",
  "wild-heart::3::Rage of the Wilds":
    "Tu Rabia aprovecha el poder primordial de los animales. Siempre que activas tu Rabia, ganas una de las siguientes opciones de tu elección. Oso: mientras tu Rabia está activa, tienes resistencia a todos los tipos de daño excepto fuerza, necrótico, psíquico y radiante. Águila: cuando activas tu Rabia, puedes realizar las acciones de Retirada y Correr como parte de la misma acción que activa tu Rabia. Lobo: mientras tu Rabia está activa, tus aliados tienen ventaja en las tiradas de ataque contra cualquier enemigo tuyo que esté a 1,5 metros o menos de ti.",
  "wild-heart::6::Aspect of the Wilds":
    "Ganas una de las siguientes opciones de tu elección. Siempre que terminas un descanso largo, puedes cambiar tu elección. Búho: tienes visión en la oscuridad con un alcance de 18 metros. Si ya tienes visión en la oscuridad, su alcance aumenta 18 metros. Pantera: tienes velocidad de escalada igual a tu velocidad. Salmón: tienes velocidad de natación igual a tu velocidad.",
  "wild-heart::10::Nature Speaker":
    "Puedes lanzar el conjuro Comunión con la naturaleza, pero solo como ritual. Sabiduría es tu característica de lanzamiento de conjuros para él.",
  "wild-heart::14::Power of the Wilds":
    "Siempre que activas tu Rabia, ganas una de las siguientes opciones de tu elección. Halcón: mientras tu Rabia está activa, tienes velocidad de vuelo igual a tu velocidad si no llevas armadura. León: mientras tu Rabia está activa, cualquiera de tus enemigos a 1,5 metros o menos de ti tiene desventaja en las tiradas de ataque contra objetivos distintos de ti o de otro bárbaro que tenga esta opción activa. Carnero: mientras tu Rabia está activa, puedes hacer que una criatura Grande o más pequeña quede en condición de derribado cuando la impactas con un ataque cuerpo a cuerpo.",
  "world-tree::3::Vitality of the Tree":
    "Tu Rabia aprovecha la fuerza vital del Árbol del Mundo. Obtienes los siguientes beneficios. Oleada de vitalidad: cuando activas tu Rabia, ganas una cantidad de puntos de golpe temporales igual a tu nivel de bárbaro. Fuerza vivificante: al inicio de cada uno de tus turnos mientras tu Rabia está activa, puedes elegir otra criatura a 3 metros o menos de ti para que gane puntos de golpe temporales; tira un número de d6 igual a tu bonificación de daño de Rabia y súmalos. Si quedan puntos de golpe temporales cuando termina tu Rabia, desaparecen.",
  "world-tree::6::Branches of the Tree":
    "Siempre que una criatura que puedes ver comienza su turno a 9 metros o menos de ti mientras tu Rabia está activa, puedes usar una reacción para teletransportarla a un espacio desocupado que puedas ver a 1,5 metros o menos de ti o al espacio desocupado más cercano que puedas ver. Tras teletransportarse, puedes reducir su velocidad a 0 hasta el final del turno actual.",
  "world-tree::10::Battering Roots":
    "Durante tu turno, tu alcance es 3 metros mayor con cualquier arma cuerpo a cuerpo, pues zarcillos del Árbol del Mundo se extienden desde ti. Cuando impactas con dicha arma en tu turno, puedes activar la propiedad de maestría Empujar o Derribar además de otra propiedad de maestría distinta que uses con esa arma.",
  "world-tree::14::Travel Along the Tree":
    "Cuando activas tu Rabia y como acción adicional mientras tu Rabia está activa, puedes teletransportarte hasta 18 metros a un espacio desocupado que puedas ver. Además, una vez por Rabia, puedes aumentar el alcance de ese teletransporte a 45 metros. Al hacerlo, también puedes llevar hasta seis criaturas dispuestas que estén a 3 metros o menos de ti. Cada criatura teletransportada a un espacio desocupado de tu elección a 3 metros o menos de tu destino.",
  "zealot::3::Divine Fury":
    "Puedes canalizar poder divino en tus golpes. En cada uno de tus turnos mientras tu Rabia está activa, la primera criatura que impactes con un arma o un Golpe sin armas recibe daño adicional igual a 1d6 más la mitad de tu nivel de bárbaro (redondeado hacia abajo). El daño adicional es necrótico o radiante; eliges el tipo cada vez que lo infliges.",
  "zealot::3::Warrior of the Gods":
    "Una entidad divina ayuda a que puedas seguir luchando. Tienes un grupo de cuatro d12 que puedes gastar para curarte. Como acción adicional, puedes gastar uno o más de esos dados, tirarlos y recuperar una cantidad de puntos de golpe igual al total. Tu grupo recupera todos los dados gastados cuando terminas un descanso largo. El número máximo de dados del grupo aumenta en uno al alcanzar los niveles 6 (5 dados), 12 (6 dados) y 17 (7 dados) de bárbaro.",
  "zealot::6::Fanatical Focus":
    "Una vez por Rabia activa, si fallas una tirada de salvación, puedes volver a tirarla con una bonificación igual a tu bonificación de daño de Rabia y debes usar la nueva tirada.",
  "zealot::10::Zealous Presence":
    "Como acción adicional, puedes exhortar a criaturas de tu elección que puedas ver a 18 metros o menos. Cada una gana ventaja en tiradas de ataque y de salvación hasta el inicio de tu siguiente turno. Una vez que usas este rasgo, no puedes volver a usarlo hasta que termines un descanso largo, a menos que gastes un uso de tu Rabia (no requiere acción) para recuperar su uso.",
  "zealot::14::Rage of the Gods":
    "Cuando activas tu Rabia, puedes adoptar la forma de un guerrero divino. Esta forma dura 1 minuto o hasta que bajes a 0 puntos de golpe. Mientras dura, obtienes los siguientes beneficios. Vuelo: tienes velocidad de vuelo igual a tu velocidad y puedes flotar. Resistencia: tienes resistencia al daño necrótico, psíquico y radiante. Revivificación: cuando una criatura a 9 metros o menos de ti va a bajar a 0 puntos de golpe, puedes usar una reacción para gastar un uso de tu Rabia y, en su lugar, cambiar los puntos de golpe del objetivo a un número igual a tu nivel de bárbaro.",
  "dance::3::Agile Strikes":
    "Cuando gastas un uso de tu Inspiración bárdica como parte de una acción, una acción adicional o una reacción, puedes hacer un ataque cuerpo a cuerpo o a distancia con un arma o un Golpe sin armas como parte de esa misma acción, acción adicional o reacción.",
  "dance::3::Bardic Damage":
    "Puedes usar Destreza en lugar de Fuerza para las tiradas de ataque de tus Golpes sin armas. Cuando infliges daño con un Golpe sin armas, puedes infligir daño contundente igual a una tirada de tu dado de Inspiración bárdica más tu modificador de Destreza, en lugar del daño normal del golpe. Esta tirada no gasta el dado.",
  "dance::3::Dance Virtuoso":
    "Tienes competencia en las herramientas de artesano que elijas. Además, tienes ventaja en cualquier prueba de característica que hagas y que implique bailar.",
  "dance::3::Dazzling Footwork":
    "Mientras no llevas armadura ni empuñas un escudo, obtienes los siguientes beneficios.",
  "dance::3::Unarmored Defense":
    "Tu CA base es igual a 10 más tus modificadores de Destreza y Carisma.",
  "dance::6::Inspiring Movement":
    "Cuando un enemigo que puedes ver termina su turno a 1,5 metros o menos de ti, puedes usar una reacción para moverte hasta la mitad de tu velocidad. Luego un aliado de tu elección a 9 metros o menos de ti también puede moverse hasta la mitad de su velocidad. Ninguno de estos movimientos provoca ataques de oportunidad.",
  "dance::6::Tandem Footwork":
    "Cuando tiras iniciativa, puedes gastar un uso de tu Inspiración bárdica si no tienes la condición de incapacitado. Al hacerlo, tira tu dado de Inspiración bárdica; tú y cada aliado a 9 metros o menos que pueda verte u oírte gana una bonificación a la iniciativa igual al número obtenido.",
  "dance::14::Leading Evasion":
    "Cuando un efecto te permite hacer una tirada de salvación de Destreza para recibir solo la mitad del daño, en su lugar no recibes daño si tienes éxito y solo la mitad si fallas. Si hay criaturas a 1,5 metros o menos de ti que hacen la misma tirada de salvación de Destreza, puedes compartir este beneficio con ellas para esa salvación. No puedes usar este rasgo si tienes la condición de incapacitado.",
  "glamour::3::Beguiling Magic":
    "Siempre tienes preparados los conjuros Hechizar persona e Imagen duplicada. Además, inmediatamente después de lanzar un conjuro de encantamiento o ilusión usando un espacio de conjuro, puedes hacer que una criatura que puedas ver a 18 metros o menos haga una tirada de salvación de Sabiduría contra tu CD de salvación de conjuros. Si falla, el objetivo queda hechizado o asustado (a tu elección) durante 1 minuto. El objetivo repite la salvación al final de cada uno de sus turnos, terminando el efecto sobre sí mismo si tiene éxito. Una vez que usas este beneficio, no puedes volver a usarlo hasta que termines un descanso largo. También puedes recuperar su uso gastando un uso de tu Inspiración bárdica (no requiere acción).",
  "glamour::3::Mantle of Inspiration":
    "Puedes tejer magia feérica en una canción o danza para llenar a otros de vigor. Como acción adicional, gastas un uso de tu Inspiración bárdica y eliges criaturas que puedas ver a 18 metros o menos, hasta un número igual a tu modificador de Carisma (mínimo una). Cada una gana puntos de golpe temporales igual al doble del número obtenido en el dado de Inspiración bárdica, y luego cada una puede usar su reacción para moverse hasta su velocidad sin provocar ataques de oportunidad.",
  "glamour::6::Mantle of Majesty":
    "Siempre tienes preparado el conjuro Mandamiento. Como acción adicional, puedes lanzar Mandamiento sin gastar un espacio de conjuro y adoptas un aspecto sobrenatural durante 1 minuto o hasta que termine tu Concentración. Durante ese tiempo, puedes lanzar Mandamiento como acción adicional sin gastar un espacio de conjuro. Cualquier criatura hechizada por ti falla automáticamente su salvación contra el Mandamiento que lanzas con este rasgo. Una vez que usas este rasgo, no puedes volver a usarlo hasta que termines un descanso largo. También puedes recuperar su uso gastando un espacio de conjuro de nivel 3 o superior (no requiere acción).",
  "glamour::14::Unbreakable Majesty":
    "Como acción adicional, adoptas una presencia majestuosa durante 1 minuto o hasta que tengas la condición de incapacitado. Mientras dura, siempre que una criatura te impacta con una tirada de ataque por primera vez en un turno, el atacante debe superar una tirada de salvación de Carisma contra tu CD de salvación de conjuros o el ataque falla, pues la criatura retrocede ante tu majestad. Una vez que adoptas esta presencia majestuosa, no puedes volver a hacerlo hasta que termines un descanso corto o largo.",
  "valor::3::Combat Inspiration":
    "Puedes usar tu ingenio para cambiar el rumbo de la batalla. Una criatura que tenga un dado de Inspiración bárdica tuyo puede usarlo para uno de los siguientes efectos. Defensa: cuando la criatura es impactada por una tirada de ataque, puede usar su reacción para tirar el dado de Inspiración bárdica y sumar el resultado a su CA contra ese ataque, haciendo que posiblemente falle. Ataque: inmediatamente después de que la criatura impacte a un objetivo con una tirada de ataque, puede tirar el dado de Inspiración bárdica y sumar el resultado al daño del ataque contra el objetivo.",
  "valor::3::Martial Training":
    "Ganas competencia con armaduras medias y escudos. Además, puedes usar un arma simple o marcial como foco de conjuro para tus conjuros de bardo.",
  "valor::6::Extra Attack":
    "Puedes atacar dos veces en lugar de una siempre que realizas la acción de Atacar en tu turno. Además, puedes lanzar uno de tus trucos con tiempo de lanzamiento de acción en lugar de uno de esos ataques.",
  "valor::14::Battle Magic":
    "Después de lanzar un conjuro con tiempo de lanzamiento de acción, puedes hacer un ataque con un arma como acción adicional.",
};

const NAME_ES_PART1: Record<string, string> = {
  "wild-heart::3::Animal Speaker": "Hablador de animales",
  "wild-heart::3::Rage of the Wilds": "Rabia de las tierras salvajes",
  "wild-heart::6::Aspect of the Wilds": "Aspecto de las tierras salvajes",
  "wild-heart::10::Nature Speaker": "Hablador de la naturaleza",
  "wild-heart::14::Power of the Wilds": "Poder de las tierras salvajes",
  "world-tree::3::Vitality of the Tree": "Vitalidad del árbol",
  "world-tree::6::Branches of the Tree": "Ramas del árbol",
  "world-tree::10::Battering Roots": "Raíces demoledoras",
  "world-tree::14::Travel Along the Tree": "Viajar por el árbol",
  "zealot::3::Divine Fury": "Furia divina",
  "zealot::3::Warrior of the Gods": "Guerrero de los dioses",
  "zealot::6::Fanatical Focus": "Enfoque fanático",
  "zealot::10::Zealous Presence": "Presencia celosa",
  "zealot::14::Rage of the Gods": "Rabia de los dioses",
  "dance::3::Agile Strikes": "Golpes ágiles",
  "dance::3::Bardic Damage": "Daño bárdico",
  "dance::3::Dance Virtuoso": "Virtuoso de la danza",
  "dance::3::Dazzling Footwork": "Juego de pies deslumbrante",
  "dance::3::Unarmored Defense": "Defensa sin armadura",
  "dance::6::Inspiring Movement": "Movimiento inspirador",
  "dance::6::Tandem Footwork": "Juego de pies en tándem",
  "dance::14::Leading Evasion": "Evasión guía",
  "glamour::3::Beguiling Magic": "Magia embaucadora",
  "glamour::3::Mantle of Inspiration": "Manto de inspiración",
  "glamour::6::Mantle of Majesty": "Manto de majestad",
  "glamour::14::Unbreakable Majesty": "Majestad inquebrantable",
  "valor::3::Combat Inspiration": "Inspiración de combate",
  "valor::3::Martial Training": "Entrenamiento marcial",
  "valor::6::Extra Attack": "Ataque adicional",
  "valor::14::Battle Magic": "Magia de batalla",
};

const allDescriptions: Record<string, string> = {
  ...DESCRIPTIONS_PART1,
  ...DESCRIPTIONS_PART2,
  ...DESCRIPTIONS_PART3,
  ...DESCRIPTIONS_PART4,
};

const allNames: Record<string, string> = {
  ...NAME_ES_PART1,
  ...NAME_ES_PART2,
  ...NAME_ES_PART3,
  ...NAME_ES_PART4,
};

const extract = JSON.parse(fs.readFileSync(extractPath, "utf8")) as Record<string, Entry>;
const keys = Object.keys(extract);
const out: Record<string, ManualEntry> = {};
const missing: string[] = [];

for (const key of keys) {
  const desc = allDescriptions[key];
  if (!desc) {
    missing.push(key);
    continue;
  }
  const entry: ManualEntry = { description: desc };
  if (allNames[key]) entry.name = allNames[key];
  out[key] = entry;
}

const enRe = /\b(the|you|your)\b/i;
const bad = Object.entries(out).filter(([, v]) => enRe.test(v.description));

if (missing.length) {
  console.error(`MISSING (${missing.length}):`);
  for (const k of missing) console.error(`  ${k}`);
  process.exitCode = 1;
}

if (bad.length) {
  console.error(`English leaks (${bad.length}):`);
  for (const [k, v] of bad) console.error(`  ${k}: ${v.description.slice(0, 80)}...`);
  process.exitCode = 1;
}

console.log(`keys: ${Object.keys(out).length}/${keys.length}, english: ${bad.length}`);
fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
