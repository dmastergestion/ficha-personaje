/**
 * Traducciones manuales PHB 2024 — Parte 4.
 * Cubre: aberrant (Hechicero), clockwork (Hechicero), wild-magic (Hechicero),
 *        archfey (Brujo), celestial (Brujo), great-old-one (Brujo),
 *        abjurer (Mago), diviner (Mago), evoker (Mago), illusionist (Mago).
 * Estilo: Foundry SRD español.
 */

export const DESCRIPTIONS_PART4: Record<string, string> = {
  // ──────────────────────────────────────────────────────────────────────
  // HECHICERO — Aberrant Mind
  // ──────────────────────────────────────────────────────────────────────
  "aberrant::3::Aberrant Sorcery":
    "Una influencia alienígena ha enredado sus tentáculos en tu mente, otorgándote poder psiónico. Ahora puedes tocar otras mentes con ese poder y alterar el mundo a tu alrededor. Quizá un viento psíquico del Plano Astral te trajo energía psionic, o quedaste expuesto a la influencia distorsionadora del Reino Lejano. Tal vez te fue implantado un renacuajo de devorador de mentes, pero tu transformación nunca se completó; ahora el poder psiónico del renacuajo es tuyo. Sea cual sea el origen, tu mente arde con él.",

  "aberrant::3::Psionic Spells":
    "Cuando alcanzas el nivel de Hechicero indicado en la tabla de Conjuros Psiónicos, tienes siempre preparados los conjuros listados.",

  "aberrant::3::Telepathic Speech":
    "Puedes forjar una conexión telepática entre tu mente y la de otra criatura. Como acción adicional, elige una criatura que puedas ver a 9 metros o menos de ti. Tú y la criatura elegida podéis comunicaros telepáticamente mientras os encontréis a un número de millas entre sí igual a tu modificador de Carisma (mínimo 1 milla). Para entenderse, cada uno debe usar mentalmente un idioma que el otro conozca. La conexión telepática dura un número de minutos igual a tu nivel de Hechicero. Termina antes si usas esta capacidad para forjar una conexión con una criatura diferente.",

  "aberrant::6::Psionic Sorcery":
    "Cuando lanzas cualquier conjuro de nivel 1 o superior de tu rasgo Conjuros Psiónicos, puedes lanzarlo gastando un espacio de conjuro de forma normal o gastando un número de Puntos de hechicería igual al nivel del conjuro. Si lo lanzas con Puntos de hechicería, no requiere componentes Verbales ni Somáticos, y tampoco requiere componentes Materiales a menos que sean consumidos por el conjuro o tengan un coste indicado en él.",

  "aberrant::6::Psychic Defenses":
    "Tienes ventaja en las tiradas de salvación para evitar o poner fin a la condición de hechizado o asustado.",

  "aberrant::14::Revelation in Flesh":
    "Puedes desatar la verdad aberrante oculta dentro de ti. Como acción adicional, puedes gastar 1 o más Puntos de hechicería para alterar mágicamente tu cuerpo durante 10 minutos. Por cada Punto de hechicería gastado, ganas uno de los siguientes beneficios a tu elección; los efectos duran hasta que termina la alteración. Adaptación acuática: ganas una velocidad de natación igual a tu velocidad y puedes respirar bajo el agua. Te crecen branquias en el cuello o detrás de las orejas, y tus dedos se vuelven palmeados o te brotan cilios ondulantes. Vuelo reluciente: ganas una velocidad de vuelo igual a tu velocidad y puedes flotar. Mientras vuelas, tu piel reluce con mucosidad o luz extraterrena. Ver lo invisible: puedes ver cualquier criatura invisible a 18 metros o menos de ti que no esté tras cobertura total. Tus ojos también se vuelven negros o se convierten en tentáculos sensoriales retorciéndose. Movimiento vermiforme: tu cuerpo, junto con cualquier equipo que lleves puesto o transportes, se vuelve viscoso y maleable. Puedes moverte a través de cualquier espacio tan estrecho como 2,5 cm y puedes gastar 1,5 metros de movimiento para escapar de restricciones no mágicas o de la condición de aferrado.",

  "aberrant::18::Warping Implosion":
    "Puedes desatar una anomalía que distorsiona el espacio. Como acción de Magia, te teletransportas a un espacio desocupado que puedas ver a 36 metros o menos de ti. Inmediatamente después de desaparecer, cada criatura a 9 metros o menos del espacio que abandonaste debe superar una tirada de salvación de Fuerza contra tu CD de salvación de conjuros. Si falla la salvación, la criatura recibe 3d10 de daño de fuerza y es arrastrada en línea recta hacia el espacio que abandonaste, terminando en el espacio desocupado más cercano a tu posición anterior. Si tiene éxito, la criatura recibe solo la mitad del daño. Una vez que usas este rasgo, no puedes volver a usarlo hasta que termines un descanso largo, a menos que gastes 5 Puntos de hechicería (no requiere acción) para recuperar su uso.",

  // ──────────────────────────────────────────────────────────────────────
  // HECHICERO — Clockwork Soul
  // ──────────────────────────────────────────────────────────────────────
  "clockwork::3::Clockwork Sorcery":
    "La fuerza cósmica del orden te ha impregnado de magia. Ese poder emana de Mechanus o de un reino similar: un plano de existencia conformado por completo por la eficiencia del mecanismo de relojería. Tú, o alguien de tu linaje, quizá quedó enredado en las maquinaciones de los módrones, los seres ordenados que habitan Mechanus. Tal vez tu antepasado participó incluso en la Gran Marcha Módron. Sea cual sea su origen en ti, el poder del orden puede parecer extraño a los demás, pero para ti forma parte de un sistema vasto y glorioso.",

  "clockwork::3::Clockwork Spells":
    "Cuando alcanzas el nivel de Hechicero indicado en la tabla de Conjuros del Mecanismo de Relojería, tienes siempre preparados los conjuros listados. Además, consulta la tabla Manifestaciones del Orden y elige o determina aleatoriamente cómo se manifiesta tu conexión con el orden mientras lanzas cualquiera de tus conjuros de Hechicero.",

  "clockwork::3::Restore Balance":
    "Tu conexión con el plano de orden absoluto te permite equilibrar los momentos caóticos. Cuando una criatura que puedes ver a 18 metros o menos de ti está a punto de tirar un d20 con ventaja, puedes usar tu reacción para cancelar tanto la ventaja como la desventaja de esa tirada. Puedes usar este rasgo un número de veces igual a tu modificador de Carisma (mínimo una vez) y recuperas todos los usos gastados cuando terminas un descanso largo.",

  "clockwork::6::Bastion of Law":
    "Puedes recurrir a la gran ecuación de la existencia para imbuir a una criatura con un escudo centelleante de orden. Como acción de Magia, puedes gastar de 1 a 5 Puntos de hechicería para crear una barrera mágica alrededor de ti mismo o de otra criatura que puedas ver a 9 metros o menos de ti. La barrera queda representada por un número de d8 igual al número de Puntos de hechicería gastados para crearla. Cuando la criatura protegida recibe daño, puede gastar uno o varios de esos dados, tirarlos y reducir el daño recibido por el total obtenido. La barrera dura hasta que termines un descanso largo o hasta que uses este rasgo de nuevo.",

  "clockwork::14::Trance of Order":
    "Ganas la capacidad de alinear tu consciencia con los cálculos infinitos de Mechanus. Como acción adicional, entras en trance durante 1 minuto y, siempre que hagas una prueba de d20 durante ese tiempo, puedes tratar cualquier resultado de 9 o menor en el d20 como un 10. Una vez que usas este rasgo, no puedes volver a usarlo hasta que termines un descanso largo, a menos que gastes 5 Puntos de hechicería (no requiere acción) para recuperar su uso.",

  "clockwork::18::Clockwork Cavalcade":
    "Convocas momentáneamente espíritus del orden para eliminar el desorden a tu alrededor. Como acción de Magia, invocas los espíritus en un cubo de 9 metros con origen en ti. Los espíritus tienen el aspecto de módrones u otros Constructos a tu elección. Son intangibles e invulnerables y crean los efectos siguientes dentro del cubo antes de desvanecerse. Una vez que usas esta acción, no puedes volver a usarla hasta que termines un descanso largo, a menos que gastes 7 Puntos de hechicería (no requiere acción) para recuperar su uso. Curar: los espíritus restauran hasta 100 puntos de golpe en total a criaturas de tu elección dentro del cubo. Reparar: los objetos dañados completamente dentro del cubo se reparan de forma instantánea. Disipar: todos los conjuros de nivel 6 e inferior terminan sobre criaturas y objetos de tu elección dentro del cubo.",

  // ──────────────────────────────────────────────────────────────────────
  // HECHICERO — Wild Magic
  // ──────────────────────────────────────────────────────────────────────
  "wild-magic::3::Wild Magic Sorcery":
    "Tu magia innata emana de las fuerzas del caos que subyacen al orden de la creación. Tú o un antepasado tuyo puede haber sufrido la exposición a magia en bruto, quizá a través de un portal planar que conducía a Limbo o a los Planos Elementales. Tal vez fuiste bendecido por un ser feérico o marcado por un demonio. O tu magia puede ser un capricho sin causa aparente. Sea cual sea su origen, esta magia fermenta en tu interior, esperando cualquier cauce.",

  "wild-magic::3::Tides of Chaos":
    "Puedes manipular el caos en sí mismo para darte ventaja antes de tirar el d20. Una vez que lo hagas, debes lanzar un conjuro de Hechicero con un espacio de conjuro o terminar un descanso largo antes de poder usar este rasgo de nuevo. Si lanzas un conjuro de Hechicero con un espacio de conjuro antes de terminar un descanso largo, el Director del juego puede hacer que tires en la tabla de Oleada de Magia Salvaje inmediatamente después de lanzar el conjuro.",

  "wild-magic::3::Wild Magic Surge":
    "Tu lanzamiento de conjuros puede desatar oleadas de magia indómita. Una vez por turno, puedes tirar 1d20 inmediatamente después de lanzar un conjuro de Hechicero con un espacio de conjuro. Si obtienes un 20, tira en la tabla de Oleada de Magia Salvaje para crear un efecto mágico. Si el efecto mágico es un conjuro, es demasiado salvaje para verse afectado por tu Metamagia.",

  "wild-magic::6::Bend Luck":
    "Tienes la capacidad de torcer el destino usando tu magia salvaje. Inmediatamente después de que otra criatura que puedas ver tire el d20 para una prueba de d20, puedes usar tu reacción y gastar 1 Punto de hechicería para tirar 1d4 y aplicar el número obtenido como bonificación o penalización (a tu elección) a esa tirada.",

  "wild-magic::14::Controlled Chaos":
    "Ganas cierto control sobre las oleadas de tu magia salvaje. Siempre que tires en la tabla de Oleada de Magia Salvaje, puedes tirar dos veces y usar cualquiera de los dos números.",

  "wild-magic::18::Tamed Surge":
    "Inmediatamente después de lanzar un conjuro de Hechicero con un espacio de conjuro, puedes crear un efecto de tu elección de la tabla de Oleada de Magia Salvaje en lugar de tirar en dicha tabla. Puedes elegir cualquier efecto de la tabla excepto el de la última fila y, si el efecto elegido implica una tirada, debes realizarla. Una vez que uses este rasgo, no puedes volver a usarlo hasta que termines un descanso largo.",

  // ──────────────────────────────────────────────────────────────────────
  // BRUJO — Archfey Patron
  // ──────────────────────────────────────────────────────────────────────
  "archfey::3::Archfey Patron":
    "Tu pacto extrae poder del Feywild. Al elegir esta subclase, podrías hacer un trato con un archihada, como el Príncipe de la Escarcha; la Reina del Aire y la Oscuridad, gobernante del Tribunal del Crepúsculo; Titania del Tribunal del Verano; o una antigua bruja. O quizá recurres a un espectro de seres feéricos, tejiendo una red de favores y deudas. Sea quien sea tu patrón, a menudo resulta inescrutable y caprichoso.",

  "archfey::3::Archfey Spells":
    "La magia de tu patrón garantiza que siempre tengas ciertos conjuros preparados; cuando alcanzas el nivel de Brujo indicado en la tabla de Conjuros del Archihada, tienes siempre preparados los conjuros listados.",

  "archfey::3::Steps of the Fey":
    "Tu patrón te concede la capacidad de desplazarte entre los límites de los planos. Puedes lanzar Paso brumoso sin gastar un espacio de conjuro un número de veces igual a tu modificador de Carisma (mínimo una vez) y recuperas todos los usos gastados cuando terminas un descanso largo. Además, siempre que lanzas ese conjuro, puedes elegir uno de los siguientes efectos adicionales. Paso revitalizante: inmediatamente después de teletransportarte, tú o una criatura que puedas ver a 3 metros o menos de ti ganas 1d10 puntos de golpe temporales. Paso provocador: las criaturas a 1,5 metros o menos del espacio que abandonaste deben superar una tirada de salvación de Sabiduría contra tu CD de salvación de conjuros o tener desventaja en las tiradas de ataque contra criaturas que no seas tú hasta el inicio de tu siguiente turno.",

  "archfey::6::Misty Escape":
    "Puedes lanzar Paso brumoso como reacción en respuesta a recibir daño. Además, los siguientes efectos están ahora entre las opciones de tu Pasos del Hada. Paso evanescente: tienes la condición de invisible hasta el inicio de tu siguiente turno o hasta inmediatamente después de realizar una tirada de ataque, infligir daño o lanzar un conjuro. Paso aterrador: las criaturas a 1,5 metros o menos del espacio que abandonaste o del espacio en el que apareces (a tu elección) deben superar una tirada de salvación de Sabiduría contra tu CD de salvación de conjuros o recibir 2d10 de daño psíquico.",

  "archfey::10::Beguiling Defenses":
    "Tu patrón te enseña a proteger tu mente y tu cuerpo. Eres inmune a la condición de hechizado. Además, inmediatamente después de que una criatura que puedas ver te impacte con una tirada de ataque, puedes usar tu reacción para obligar al atacante a hacer una tirada de salvación de Sabiduría contra tu CD de salvación de conjuros. Si falla, el atacante queda hechizado por ti durante 1 minuto o hasta que tú o tus aliados le causeis daño. Una vez que usas este rasgo, no puedes volver a usarlo hasta que termines un descanso largo, a menos que gastes un espacio de Magia de pacto (no requiere acción) para recuperar su uso.",

  "archfey::14::Bewitching Magic":
    "Tu patrón te concede la capacidad de entrelazar tu magia con la teletransportación. Inmediatamente después de lanzar un conjuro de Encantamiento o Ilusión usando una acción y un espacio de conjuro, puedes lanzar Paso brumoso como parte de la misma acción y sin gastar un espacio de conjuro.",

  // ──────────────────────────────────────────────────────────────────────
  // BRUJO — Celestial Patron
  // ──────────────────────────────────────────────────────────────────────
  "celestial::3::Celestial Patron":
    "Tu pacto extrae poder de los Planos Superiores, los reinos de la eterna bienaventuranza. Podrías celebrar un acuerdo con un empíreo, un cuatl, una esfinge, un unicornio u otra entidad celestial. O quizá recurres a numerosos seres de ese tipo mientras persigues objetivos afines a los suyos. Tu pacto te permite experimentar un atisbo de la santa luz que ilumina el multiverso.",

  "celestial::3::Celestial Spells":
    "La magia de tu patrón garantiza que siempre tengas ciertos conjuros preparados; cuando alcanzas el nivel de Brujo indicado en la tabla de Conjuros del Celestial, tienes siempre preparados los conjuros listados.",

  "celestial::3::Healing Light":
    "Ganas la capacidad de canalizar energía celestial para sanar heridas. Dispones de un grupo de d6 para alimentar esta curación. El número de dados del grupo es igual a 1 más tu nivel de Brujo. Como acción adicional, puedes gastar dados del grupo (hasta un máximo de 5 a la vez). Tíralos. Una criatura a la que toques recupera un número de puntos de golpe igual al total de la tirada. Tu grupo recupera todos los dados gastados cuando terminas un descanso largo.",

  "celestial::6::Radiant Soul":
    "Tu vínculo con tu patrón te permite servir como canal de energía radiante. Tienes resistencia al daño radiante. Una vez por turno, cuando un conjuro que lanzas inflige daño radiante o de fuego, puedes añadir tu modificador de Carisma a ese daño del conjuro contra uno de sus objetivos.",

  "celestial::10::Celestial Resilience":
    "Ganas puntos de golpe temporales siempre que terminas un descanso corto o largo. La cantidad es igual a tu nivel de Brujo más tu modificador de Carisma. Además, elige hasta cinco criaturas que puedas ver cuando ganes esos puntos. Cada una de esas criaturas gana puntos de golpe temporales igual a la mitad de tu nivel de Brujo más tu modificador de Carisma.",

  "celestial::14::Searing Vengeance":
    "Cuando tú o un aliado a 18 metros o menos de ti está a punto de realizar una tirada de salvación contra la muerte, puedes usar tu reacción para intervenir. La criatura recupera puntos de golpe iguales a la mitad de su máximo de puntos de golpe y puede poner fin a la condición de derribado sobre sí misma. Cada criatura de tu elección a 9 metros o menos del objetivo recibe daño radiante igual a 2d8 más tu modificador de Carisma, y cada una tiene la condición de cegado hasta el final del turno actual. Una vez que uses este rasgo, no puedes volver a usarlo hasta que termines un descanso largo.",

  // ──────────────────────────────────────────────────────────────────────
  // BRUJO — Great Old One Patron
  // ──────────────────────────────────────────────────────────────────────
  "great-old-one::3::Great Old One Patron":
    "Al elegir esta subclase, podrías vincularte a un ser indescriptible del Reino Lejano o a un dios antiguo: un ser como Tharizdun, el Dios Encadenado; Zargon, el que Regresa; Hadar, el Hambre Oscura; o el Gran Cthulhu. O quizá invocas a varias entidades sin atarte a ninguna. Los motivos de estos seres son incomprensibles y el Gran Antiguo podría ser indiferente a tu existencia. Aun así, los secretos que has aprendido te permiten extraer de él una extraña magia.",

  "great-old-one::3::Awakened Mind":
    "Puedes forjar una conexión telepática entre tu mente y la de otra criatura. Como acción adicional, elige una criatura que puedas ver a 9 metros o menos de ti. Tú y la criatura elegida podéis comunicaros telepáticamente mientras os encontréis a un número de millas entre sí igual a tu modificador de Carisma (mínimo 1 milla). Para entenderse, cada uno debe usar mentalmente un idioma que el otro conozca. La conexión telepática dura un número de minutos igual a tu nivel de Brujo. Termina antes si usas este rasgo para conectar con una criatura diferente.",

  "great-old-one::3::Great Old One Spells":
    "La magia de tu patrón garantiza que siempre tengas ciertos conjuros preparados; cuando alcanzas el nivel de Brujo indicado en la tabla de Conjuros del Gran Antiguo, tienes siempre preparados los conjuros listados.",

  "great-old-one::3::Psychic Spells":
    "Cuando lanzas un conjuro de Brujo que inflige daño, puedes cambiar su tipo de daño a psíquico. Además, cuando lanzas un conjuro de Brujo que es una adivinación o encantamiento, puedes hacerlo sin componentes Verbales ni Somáticos.",

  "great-old-one::6::Clairvoyant Combatant":
    "Cuando forjas un vínculo telepático con una criatura usando tu Mente despierta, puedes obligarla a hacer una tirada de salvación de Sabiduría contra tu CD de salvación de conjuros. Si falla, tienes ventaja en las tiradas de ataque contra esa criatura durante la duración del vínculo. Una vez que usas este rasgo, no puedes volver a usarlo hasta que termines un descanso corto o largo, a menos que gastes un espacio de Magia de pacto (no requiere acción) para recuperar su uso.",

  "great-old-one::10::Eldritch Hex":
    "Tu patrón alienígena te concede una maldición poderosa. Tienes siempre preparado el conjuro Maldición. Cuando lanzas Maldición y eliges una característica, el objetivo también tiene desventaja en las tiradas de salvación de esa característica durante la duración del conjuro.",

  "great-old-one::10::Thought Shield":
    "Tus pensamientos no pueden ser leídos por telepatía ni por otros medios a menos que tú lo permitas. También tienes resistencia al daño psíquico y, siempre que una criatura te inflige daño psíquico, esa criatura recibe la misma cantidad de daño que tú.",

  "great-old-one::14::Create Thrall":
    "Cuando lanzas Invocar aberración, puedes modificarlo para que no requiera Concentración. Si lo haces, la duración del conjuro para ese lanzamiento se convierte en 1 minuto y, al ser invocada, la Aberración tiene un número de puntos de golpe temporales igual a tu nivel de Brujo más tu modificador de Carisma. Además, la primera vez en cada turno que la Aberración impacte a una criatura bajo el efecto de tu Maldición, la Aberración inflige daño psíquico adicional al objetivo igual al daño adicional de ese conjuro.",

  // ──────────────────────────────────────────────────────────────────────
  // MAGO — Abjurer
  // ──────────────────────────────────────────────────────────────────────
  "abjurer::3::Abjurer":
    "Tu estudio de la magia se centra en conjuros que bloquean, destierran o protegen: poner fin a efectos dañinos, desterrar influencias malignas y proteger a los débiles. Los Abjuradores son buscados cuando se requiere exorcizar espíritus malignos, cuando se deben proteger lugares contra el espionaje mágico y cuando hay que cerrar portales a otros planos de existencia. Los grupos de aventureros valoran a los Abjuradores por la protección que ofrecen contra una variedad de magia hostil y otros ataques.",

  "abjurer::3::Abjuration Savant":
    "Elige dos conjuros de abjuración, cada uno de los cuales debe ser de nivel 2 o inferior, y añádelos a tu libro de conjuros de forma gratuita. Además, siempre que obtienes acceso a un nuevo nivel de espacios de conjuro en esta clase, puedes añadir un conjuro de Mago de la escuela de Abjuración a tu libro de conjuros de forma gratuita. El conjuro elegido debe ser de un nivel para el que tengas espacios de conjuro.",

  "abjurer::3::Arcane Ward":
    "Puedes tejer magia a tu alrededor para protegerte. Cuando lanzas un conjuro de Abjuración con un espacio de conjuro, puedes usar simultáneamente un hilo de la magia del conjuro para crear una barrera mágica sobre ti mismo que dura hasta que termines un descanso largo. La barrera tiene un máximo de puntos de golpe igual al doble de tu nivel de Mago más tu modificador de Inteligencia. Siempre que recibes daño, la barrera recibe el daño en su lugar y, si tienes Resistencias o Vulnerabilidades, aplícalas antes de reducir los puntos de golpe de la barrera. Si queda daño después de reducir los puntos de golpe de la barrera, lo recibes tú. Mientras la barrera tiene 0 puntos de golpe, no puede absorber daño, pero su magia permanece. Siempre que lanzas un conjuro de Abjuración con un espacio de conjuro, la barrera recupera un número de puntos de golpe igual al doble del nivel del conjuro. Además, como acción adicional, puedes gastar un espacio de conjuro para que la barrera recupere un número de puntos de golpe igual al doble del nivel del espacio gastado. Una vez que creas la barrera, no puedes volver a crearla hasta que termines un descanso largo.",

  "abjurer::6::Projected Ward":
    "Cuando una criatura que puedes ver a 9 metros o menos de ti recibe daño, puedes usar tu reacción para hacer que tu Barrera arcana absorba ese daño. Si la barrera tiene puntos de golpe, gasta de ella los puntos necesarios y la criatura protegida recibe el daño restante. Si esa criatura tiene Resistencias o Vulnerabilidades, aplícalas antes de reducir los puntos de golpe de la barrera.",

  "abjurer::10::Spell Breaker":
    "Tienes siempre preparados los conjuros Contrahechizo y Disipar magia. Además, puedes lanzar Disipar magia como acción adicional y puedes añadir tu bonificación de competencia a la prueba de característica del conjuro. Cuando lanzas cualquiera de esos conjuros con un espacio de conjuro, dicho espacio no se gasta si el conjuro no logra detener un conjuro.",

  "abjurer::14::Spell Resistance":
    "Tienes ventaja en las tiradas de salvación contra conjuros. Además, tienes resistencia al daño de los conjuros.",

  // ──────────────────────────────────────────────────────────────────────
  // MAGO — Diviner
  // ──────────────────────────────────────────────────────────────────────
  "diviner::3::Diviner":
    "El consejo de un Adivinador es buscado por quienes desean comprender mejor el pasado, el presente y el futuro. Como Adivinador, te esfuerzas por descorrer los velos del espacio, el tiempo y la consciencia. Trabajas para dominar los conjuros de discernimiento, visión remota, conocimiento sobrenatural y presciencia.",

  "diviner::3::Divination Savant":
    "Elige dos conjuros de adivinación, cada uno de los cuales debe ser de nivel 2 o inferior, y añádelos a tu libro de conjuros de forma gratuita. Además, siempre que obtienes acceso a un nuevo nivel de espacios de conjuro en esta clase, puedes añadir un conjuro de Mago de la escuela de Adivinación a tu libro de conjuros de forma gratuita. El conjuro elegido debe ser de un nivel para el que tengas espacios de conjuro.",

  "diviner::3::Portent":
    "Visiones del futuro comienzan a presionar tu consciencia. Siempre que terminas un descanso largo, tiras dos d20 y apuntas los números obtenidos. Puedes reemplazar cualquier tirada de ataque, tirada de salvación o prueba de característica realizada por ti o por una criatura que puedas ver con una de estas tiradas proféticas. Debes elegir hacerlo antes de la tirada y solo puedes sustituir una tirada de este modo una vez por turno. Cada tirada profética solo puede usarse una vez. Cuando terminas un descanso largo, pierdes las tiradas proféticas no utilizadas.",

  "diviner::6::Expert Divination":
    "Lanzar conjuros de Adivinación te resulta tan fácil que solo consume una fracción de tu esfuerzo de lanzamiento. Cuando lanzas un conjuro de Adivinación usando un espacio de conjuro de nivel 2 o superior, recuperas un espacio de conjuro gastado. El espacio recuperado debe ser de un nivel inferior al espacio gastado y no puede ser superior al nivel 5.",

  "diviner::10::The Third Eye":
    "Puedes aumentar tus poderes de percepción. Como acción adicional, ganas uno de los siguientes beneficios a tu elección, que dura hasta que terminas un descanso corto o largo o hasta que uses este rasgo de nuevo. Visión en la oscuridad: ganas visión en la oscuridad con un alcance de 36 metros. Comprensión superior: puedes leer cualquier idioma. Ver invisibilidad: puedes lanzar Ver invisibilidad sin gastar un espacio de conjuro.",

  "diviner::14::Greater Portent":
    "Las visiones de tus sueños se intensifican y pintan en tu mente una imagen más precisa de lo que está por venir. Tira tres d20 para tu rasgo Presagio en lugar de dos.",

  // ──────────────────────────────────────────────────────────────────────
  // MAGO — Evoker
  // ──────────────────────────────────────────────────────────────────────
  "evoker::3::Evoker":
    "Tus estudios se centran en la magia que crea poderosos efectos elementales como el frío gélido, la llama abrasadora, el trueno retumbante, el rayo crepitante y el ácido ardiente. Algunos Evocadores encuentran empleo en fuerzas militares, sirviendo de artillería para arrasar ejércitos a distancia. Otros usan su poder para proteger a los demás, mientras que algunos buscan su propio beneficio.",

  "evoker::3::Evocation Savant":
    "Elige dos conjuros de evocación, cada uno de los cuales debe ser de nivel 2 o inferior, y añádelos a tu libro de conjuros de forma gratuita. Además, siempre que obtienes acceso a un nuevo nivel de espacios de conjuro en esta clase, puedes añadir un conjuro de Mago de la escuela de Evocación a tu libro de conjuros de forma gratuita. El conjuro elegido debe ser de un nivel para el que tengas espacios de conjuro.",

  "evoker::3::Potent Cantrip":
    "Tus trucos dañinos afectan incluso a las criaturas que esquivan lo peor del efecto. Cuando lanzas un truco contra una criatura y fallas la tirada de ataque o el objetivo supera la tirada de salvación contra el truco, el objetivo recibe la mitad del daño del truco (si lo hay), pero no sufre ningún efecto adicional.",

  "evoker::6::Sculpt Spells":
    "Puedes crear bolsas de seguridad relativa dentro de los efectos de tus evocaciones. Cuando lanzas un conjuro de Evocación que afecta a otras criaturas que puedes ver, puedes elegir un número de ellas igual a 1 más el nivel del conjuro. Las criaturas elegidas superan automáticamente sus tiradas de salvación contra el conjuro y no reciben daño si normalmente recibirían la mitad al superar la salvación.",

  "evoker::10::Empowered Evocation":
    "Siempre que lanzas un conjuro de Mago de la escuela de Evocación, puedes añadir tu modificador de Inteligencia a una tirada de daño de ese conjuro.",

  "evoker::14::Overchannel":
    "Puedes aumentar el poder de tus conjuros. Cuando lanzas un conjuro de Mago con un espacio de conjuro de nivel 1–5 que inflige daño, puedes infligir el daño máximo con ese conjuro en el turno en que lo lanzas. La primera vez que lo haces, no sufres ningún efecto adverso. Si vuelves a usar este rasgo antes de terminar un descanso corto o largo, recibes 2d12 de daño necrótico por nivel de conjuro inmediatamente después de lanzarlo y ese daño ignora Resistencia e Inmunidad. Cada vez que usas este rasgo de nuevo antes de terminar un descanso largo, el daño necrótico por nivel de conjuro aumenta en 1d12.",

  // ──────────────────────────────────────────────────────────────────────
  // MAGO — Illusionist
  // ──────────────────────────────────────────────────────────────────────
  "illusionist::3::Illusionist":
    "Te especializas en la magia que deslumbra los sentidos y engaña la mente, y las ilusiones que creas hacen que lo imposible parezca real.",

  "illusionist::3::Illusion Savant":
    "Elige dos conjuros de ilusión, cada uno de los cuales debe ser de nivel 2 o inferior, y añádelos a tu libro de conjuros de forma gratuita. Además, siempre que obtienes acceso a un nuevo nivel de espacios de conjuro en esta clase, puedes añadir un conjuro de Mago de la escuela de Ilusión a tu libro de conjuros de forma gratuita. El conjuro elegido debe ser de un nivel para el que tengas espacios de conjuro.",

  "illusionist::3::Improved Illusions":
    "Puedes lanzar conjuros de Ilusión sin proporcionar componentes Verbales y, si un conjuro de Ilusión que lanzas tiene un alcance de 3 metros o más, el alcance aumenta en 18 metros. También conoces el truco Ilusión menor. Si ya lo conoces, aprendes un truco de Mago diferente a tu elección; no cuenta para tu número de trucos conocidos. Puedes crear tanto un sonido como una imagen con un único lanzamiento de Ilusión menor y puedes lanzarlo como acción adicional.",

  "illusionist::6::Phantasmal Creatures":
    "Tienes siempre preparados los conjuros Invocar bestia e Invocar feérico. Siempre que lanzas cualquiera de ellos, puedes cambiar su escuela a Ilusión, lo que hace que la criatura invocada tenga aspecto espectral. Puedes lanzar la versión de Ilusión de cada conjuro sin gastar un espacio de conjuro, pero al lanzarlo sin espacio se reduce a la mitad el máximo de puntos de golpe de la criatura. Una vez lanzas cualquiera de los conjuros de este modo, debes terminar un descanso largo antes de poder volverte a lanzar ese conjuro de esa forma.",

  "illusionist::10::Illusory Self":
    "Cuando una criatura te impacta con una tirada de ataque, puedes usar tu reacción para interponer un duplicado ilusorio de ti mismo entre el atacante y tú. El ataque falla automáticamente; luego la ilusión se disipa. Una vez que usas este rasgo, no puedes volver a usarlo hasta que termines un descanso corto o largo. También puedes restaurar su uso gastando un espacio de conjuro de nivel 2 o superior (no requiere acción).",

  "illusionist::14::Illusory Reality":
    "Has aprendido a tejer magia de sombras en tus ilusiones para dotarlas de una semirealidad. Cuando lanzas un conjuro de Ilusión con un espacio de conjuro, puedes elegir un objeto inanimado y no mágico que forme parte de la ilusión y hacer que ese objeto sea real. Puedes hacerlo en tu turno como acción adicional mientras el conjuro está activo. El objeto permanece real durante 1 minuto, tiempo durante el cual no puede infligir daño ni imponer condiciones. Por ejemplo, puedes crear la ilusión de un puente sobre un abismo y luego hacerlo real para cruzarlo.",
};

export const NAME_ES_PART4: Record<string, string> = {
  // Aberrant Mind (Hechicero)
  "aberrant::3::Aberrant Sorcery": "Hechicería aberrante",
  "aberrant::3::Psionic Spells": "Conjuros psiónicos",
  "aberrant::3::Telepathic Speech": "Habla telepática",
  "aberrant::6::Psionic Sorcery": "Hechicería psiónica",
  "aberrant::6::Psychic Defenses": "Defensas psíquicas",
  "aberrant::14::Revelation in Flesh": "Revelación en la carne",
  "aberrant::18::Warping Implosion": "Implosión distorsionante",
  // Clockwork Soul (Hechicero)
  "clockwork::3::Clockwork Sorcery": "Hechicería del mecanismo de relojería",
  "clockwork::3::Clockwork Spells": "Conjuros del mecanismo de relojería",
  "clockwork::3::Restore Balance": "Restaurar el equilibrio",
  "clockwork::6::Bastion of Law": "Bastión de la ley",
  "clockwork::14::Trance of Order": "Trance del orden",
  "clockwork::18::Clockwork Cavalcade": "Caravana del mecanismo",
  // Wild Magic (Hechicero)
  "wild-magic::3::Wild Magic Sorcery": "Hechicería de magia salvaje",
  "wild-magic::3::Tides of Chaos": "Mareas del caos",
  "wild-magic::3::Wild Magic Surge": "Oleada de magia salvaje",
  "wild-magic::6::Bend Luck": "Torcer la suerte",
  "wild-magic::14::Controlled Chaos": "Caos controlado",
  "wild-magic::18::Tamed Surge": "Oleada domesticada",
  // Archfey Patron (Brujo)
  "archfey::3::Archfey Patron": "Patrón archihada",
  "archfey::3::Archfey Spells": "Conjuros del archihada",
  "archfey::3::Steps of the Fey": "Pasos del hada",
  "archfey::6::Misty Escape": "Escape brumoso",
  "archfey::10::Beguiling Defenses": "Defensas seductoras",
  "archfey::14::Bewitching Magic": "Magia hechizante",
  // Celestial Patron (Brujo)
  "celestial::3::Celestial Patron": "Patrón celestial",
  "celestial::3::Celestial Spells": "Conjuros celestiales",
  "celestial::3::Healing Light": "Luz curativa",
  "celestial::6::Radiant Soul": "Alma radiante",
  "celestial::10::Celestial Resilience": "Resiliencia celestial",
  "celestial::14::Searing Vengeance": "Venganza abrasadora",
  // Great Old One Patron (Brujo)
  "great-old-one::3::Great Old One Patron": "Patrón Gran Antiguo",
  "great-old-one::3::Awakened Mind": "Mente despierta",
  "great-old-one::3::Great Old One Spells": "Conjuros del Gran Antiguo",
  "great-old-one::3::Psychic Spells": "Conjuros psíquicos",
  "great-old-one::6::Clairvoyant Combatant": "Combatiente clarividente",
  "great-old-one::10::Eldritch Hex": "Maldición sobrenatural",
  "great-old-one::10::Thought Shield": "Escudo mental",
  "great-old-one::14::Create Thrall": "Crear esclavo",
  // Abjurer (Mago)
  "abjurer::3::Abjurer": "Abjurador",
  "abjurer::3::Abjuration Savant": "Sabio de la abjuración",
  "abjurer::3::Arcane Ward": "Barrera arcana",
  "abjurer::6::Projected Ward": "Barrera proyectada",
  "abjurer::10::Spell Breaker": "Rompeconjuros",
  "abjurer::14::Spell Resistance": "Resistencia a conjuros",
  // Diviner (Mago)
  "diviner::3::Diviner": "Adivinador",
  "diviner::3::Divination Savant": "Sabio de la adivinación",
  "diviner::3::Portent": "Presagio",
  "diviner::6::Expert Divination": "Adivinación experta",
  "diviner::10::The Third Eye": "El tercer ojo",
  "diviner::14::Greater Portent": "Presagio superior",
  // Evoker (Mago)
  "evoker::3::Evoker": "Evocador",
  "evoker::3::Evocation Savant": "Sabio de la evocación",
  "evoker::3::Potent Cantrip": "Truco potente",
  "evoker::6::Sculpt Spells": "Esculpir conjuros",
  "evoker::10::Empowered Evocation": "Evocación potenciada",
  "evoker::14::Overchannel": "Sobrecargar",
  // Illusionist (Mago)
  "illusionist::3::Illusionist": "Ilusionista",
  "illusionist::3::Illusion Savant": "Sabio de la ilusión",
  "illusionist::3::Improved Illusions": "Ilusiones mejoradas",
  "illusionist::6::Phantasmal Creatures": "Criaturas fantasmales",
  "illusionist::10::Illusory Self": "Yo ilusorio",
  "illusionist::14::Illusory Reality": "Realidad ilusoria",
};
