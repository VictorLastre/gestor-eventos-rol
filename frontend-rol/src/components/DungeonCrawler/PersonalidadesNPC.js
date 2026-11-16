// Fichas de Personalidad y Árbol de Diálogos de los NPCs de la Asociación de Rol La Pampa
// Basado en el cuestionario oficial de voz de los miembros de la junta directiva.

export const PERSONALIDADES_NPC = {
  diny: {
    id: 'diny',
    nombre: 'Diana "Diny"',
    cargo: 'La Cartógrafa de la Mazmorra',
    subtitulo: 'Secretaría de Exploración & Planos',
    gremio: 'Asociación de Rol La Pampa',
    spritePrefijo: 'npc_diny',
    pitchVoz: 530,
    colorTema: '#38bdf8', // Celeste cartografía
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    descripcion: 'Dibuja con precisión milimétrica la inmensa mega-dungeon West Marches de la Cripta. Cuida sus pergaminos y su café por encima de todas las cosas.',
    respuestasOriginales: {
      saludo: 'Buenasssssss',
      muerteAbsurda: '¿Quién lo habría dicho? A NADIE SE LE OCURRIÓ que eso podría salir mal...',
      regateo: 'Ahí va, claro que sí. (¿En serio?...) No.',
      pergamino: '"Oh, un lienzo en blanco... Me tientas"',
      pelea: 'Si se van a matar que sea lejos del papel... o mi café. Gracias.',
      consejo: 'Quizás es momento de tu evento canónico... Mucha suerte.'
    },
    dialogoInicial: 'Buenasssssss... *sopla suavemente una taza de café caliente*. ¿Vienes por un mapa o a distraerme de mis trazos?',
    opciones: [
      {
        id: 'abrir_tienda_diny',
        texto: '🗺️ Abrir Tienda de Cartografía & Herramientas de Diny',
        accion: 'abrir_tienda_diny',
        respuesta: '¡Tengo pergaminos para revelar todo el plano, cuerdas y ganzúas de precisión!'
      },
      {
        id: 'mapa_seguridad',
        texto: 'Trazar Hoguera y Escalera en el Mapa (25 Oro)',
        costoOro: 25,
        accion: 'revelar_seguridad',
        respuesta: 'Oh, un lienzo en blanco... Me tientas. Listo, te tracé con tinta luminosa el Santuario y la Escalera. Ahora al menos tienes un rumbo.'
      },
      {
        id: 'mapa_completo',
        texto: 'Revelar Todo el Mapa del Piso Actual (75 Oro)',
        costoOro: 75,
        accion: 'revelar_completo',
        respuesta: 'Oh, un lienzo en blanco... Me tientas. ¡Aquí tienes el plano completo del piso! Y recuerda: si se van a matar, que sea lejos del papel... o mi café. Gracias.'
      },
      {
        id: 'consejo',
        texto: '¿Qué me recomiendas antes de entrar a la sala del jefe?',
        accion: 'dialogo_consejo',
        respuesta: 'Quizás es momento de tu evento canónico... Mucha suerte.'
      },
      {
        id: 'regatear',
        texto: '¿Me haces una rebajita de gremio por ser socio?',
        accion: 'dialogo_regateo',
        respuesta: 'Ahí va, claro que sí... ¿En serio creíste que te iba a decir que sí? No. Pagá lo que vale el mapa.'
      },
      {
        id: 'muerte_pregunta',
        texto: 'Acabo de morir de una forma muy tonta...',
        accion: 'dialogo_muerte',
        respuesta: '¿Quién lo habría dicho? A NADIE SE LE OCURRIÓ que eso podría salir mal...'
      },
      {
        id: 'salir',
        texto: 'Volver a la exploración',
        accion: 'cerrar'
      }
    ]
  },

  delo: {
    id: 'delo',
    nombre: 'Agustina "Delo"',
    cargo: 'La Alquimista Halfling & Boticaria',
    subtitulo: 'Suministros Oficiales del Gremio',
    gremio: 'Asociación de Rol La Pampa',
    spritePrefijo: 'npc_delo',
    pitchVoz: 590,
    colorTema: '#c084fc', // Púrpura alquimia
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    descripcion: 'Mercader errante halfling que siempre lleva morfi en la mochila, frascos burbujeantes y anteojos listos para leer el reglamento.',
    respuestasOriginales: {
      saludo: 'Alo Alo pips que se cuentan? 😂 Sacando morfi de la mochila',
      muerteAbsurda: 'Bueno...eso no me lo esperaba/ eso estuvo interesante 😂 buena suerte la próxima!',
      favor: 'escucho...no es molestia',
      regateo: 'no hay drama (igual que no te vea fumandote la plata después)',
      evitarRegla: 'A ver honey... que picha estás haciendo? 😒 *Tose y se pone los anteojos antes de arrancar un monólogo interminable sobre las reglas*',
      muletillas: 'alo alo, lady, hun, no lo sé Rick, hijo de la buena...vení para acá ,*tose *, *sonido de escopeta *',
      consejo: '¿Seguro que querés esto? / Buena suerte Charlie (?'
    },
    dialogoInicial: '¡Alo Alo pips! ¿Qué se cuentan? 😂 *sacando morfi de la mochila* ¿Vienen a equiparse para no morir en el primer pasillo?',
    opciones: [
      {
        id: 'abrir_tienda_delo',
        texto: '🛒 Abrir Tienda de Pociones & Alquimia de Delo',
        accion: 'abrir_tienda_delo',
        respuesta: '¡Alo alo! Mirá todo lo que tengo en la manta: pociones curativas, de POD y raciones recién preparadas.'
      },
      {
        id: 'comprar_pocion',
        texto: 'Poción Mayor de Salud (+80 HP) - 30 Oro',
        costoOro: 30,
        accion: 'pocion_vida',
        respuesta: 'Tomá este frasco rojo, hun. Te va a levantar hasta los huesos. ¡Hijo de la buena, cuidala que no crecen en los árboles!'
      },
      {
        id: 'comprar_morfi',
        texto: 'Morfi de la Mochila (Regeneración continua de vida) - 20 Oro',
        costoOro: 20,
        accion: 'buff_morfi',
        respuesta: '¡El verdadero manjar del aventurero! *saca una empanada calentita de la mochila*. Comete esto y vas a ir recuperando vida de a poco durante 30 segundos.'
      },
      {
        id: 'comprar_aceite',
        texto: 'Piedra de Afilar Rúnica (Repara +35 durabilidad de arma) - 25 Oro',
        costoOro: 25,
        accion: 'reparar_arma',
        respuesta: 'Con esto le sacás filo a tu arma en dos patadas en medio del combate sin tener que volver a la forja. ¡De nada, lady!'
      },
      {
        id: 'regatear',
        texto: '¿Me haces precio de amigo?',
        accion: 'dialogo_regateo',
        respuesta: 'Bueno dale, te hago una atención... ¡igual que no te vea fumándote la plata en otra cosa después, eh! 😒 *sonido de escopeta*'
      },
      {
        id: 'consejo',
        texto: '¿Qué me decís del peligro que hay en la sala del jefe?',
        accion: 'dialogo_consejo',
        respuesta: '¿Seguro que querés meterte ahí abajo?... *tose y acomoda los frascos* ¡Buena suerte Charlie! (?'
      },
      {
        id: 'evitar_regla',
        texto: '¿Y si me llevo una poción fiada?',
        accion: 'dialogo_reglas',
        respuesta: 'A ver honey... ¿qué picha estás haciendo? 😒 *Tose y se pone los anteojos antes de arrancar un monólogo interminable sobre los estatutos del Gremio y por qué fiar está prohibido en el artículo 4*'
      },
      {
        id: 'salir',
        texto: 'Volver a la exploración',
        accion: 'cerrar'
      }
    ]
  },

  martin: {
    id: 'martin',
    nombre: 'Martín',
    cargo: 'Guerrero de Vanguardia',
    subtitulo: 'Líder Táctico & Compañero de Batalla',
    gremio: 'Asociación de Rol La Pampa',
    spritePrefijo: 'knight',
    pitchVoz: 390,
    colorTema: '#3b82f6',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    descripcion: 'Veterano marcial de la Asociación. Empuña espada larga y escudo en la vanguardia protegiendo a la Compañía.',
    respuestasOriginales: {
      saludo: 'Vamos a empezar...',
      muerteAbsurda: '*Mira el terreno táctico y evalúa el peligro*',
      regateo: 'A ver, convenceme...',
      muletilla: '*Afirma el agarre en su escudo de batalla*',
      problema: 'Lo podemos solucionar asi: formación cerrada y cubrir la retaguardia.',
      consejo: '¿Estas seguro?... Mantén la distancia y protege a los lanzadores de conjuros.'
    },
    dialogoInicial: '¡Vamos a empezar! Mantén la guardia alta y no te separes de la formación. ¿Listo para explorar este sector?',
    opciones: [
      {
        id: 'unirse',
        texto: '¿Te unirías a mi Compañía Aventurera para explorar?',
        accion: 'unirse_party',
        respuesta: '¡Por supuesto! Cuento con mi espada y mi escudo. En grupo somos invencibles.'
      },
      {
        id: 'consejo',
        texto: '¿Qué consejo táctico recomiendas para este sector?',
        accion: 'dialogo_consejo',
        respuesta: '¿Estas seguro?... Recuerda afilar tus armas en la forja y coordinar los ataques concentrándose en un solo enemigo a la vez.'
      },
      {
        id: 'salir',
        texto: 'Retomar la marcha',
        accion: 'cerrar'
      }
    ],
    generarJuicioMuerte: (armaRota, oroPerdido, expulsado, sector) => {
      return PERSONALIDADES_NPC.guardian_umbral.generarJuicioMuerte(armaRota, oroPerdido, expulsado, sector);
    }
  },

  guardian_umbral: {
    id: 'guardian_umbral',
    nombre: 'El Guardián del Umbral',
    cargo: 'Centinela del Santuario de Resurrección',
    subtitulo: 'Custodio de las Almas de la Gran Cripta',
    gremio: 'Entidad Mística de la Mazmorra',
    spritePrefijo: 'npc_angel',
    pitchVoz: 260,
    colorTema: '#8b5cf6',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    descripcion: 'Entidad espectral antigua que resguarda a los héroes caídos antes de que la Cripta consuma sus espíritus.',
    dialogoInicial: 'Las sombras de la cripta son implacables... Descansa junto al fuego sagrado y recupera tus fuerzas.',
    opciones: [
      {
        id: 'bendicion',
        texto: 'Pido una bendición para el próximo combate',
        accion: 'dialogo_consejo',
        respuesta: 'El fuego sagrado reconforta tu espíritu. Mantén la calma cuando los monstruos te rodeen en grupo.'
      },
      {
        id: 'salir',
        texto: 'Volver a levantarse',
        accion: 'cerrar'
      }
    ],
    generarJuicioMuerte: (armaRota, oroPerdido, expulsado, sector) => {
      if (armaRota) {
        return {
          titulo: '🕯️ ¡RESGUARDADO POR EL GUARDIÁN DEL UMBRAL!',
          mensaje: 'Tu arma quedó mellada y tus fuerzas flaquearon en la penumbra. El Guardián te ha arrastrado de regreso a la hoguera del Santuario.'
        };
      }
      if (expulsado) {
        return {
          titulo: '⚠️ ¡RETIRADA AL SANTUARIO SEGURO!',
          mensaje: `Caíste en combate antes de asegurar la hoguera del Sector ${sector}. El Guardián te resguarda en el Sector ${Math.max(1, sector - 1)}.`
        };
      }
      return {
        titulo: '🕯️ ¡DESPERTAR EN EL SANTUARIO!',
        mensaje: `Has caído en combate en las profundidades. El Guardián del Umbral te ha devuelto al santuario de resurrección para que continúes la gesta.`
      };
    }
  },

  guille: {
    id: 'guille',
    nombre: 'Guillermo "Chiquito"',
    cargo: 'El Tesorero de la Cripta',
    subtitulo: 'Recaudación Extraordinaria del Gremio',
    gremio: 'Asociación de Rol La Pampa',
    spritePrefijo: 'npc_chiquito',
    pitchVoz: 350,
    colorTema: '#f59e0b',
    badgeColor: 'bg-amber-600/20 text-amber-300 border-amber-600/40',
    descripcion: 'Custodio del cofre comunitario. Aparece en las salas seguras (y en las falsas) para asegurarse de que las cuentas de la Asociación cierren en positivo.',
    respuestasOriginales: {
      saludo: 'Perdon por la tardanza,',
      muerteAbsurda: 'No te puedo negar que se veia venir,',
      regateo: '¡¡¡RAJA DE ACA!!! (si me piden descuentos)',
      muletilla: 'Mira, con mi suerte con los dados,',
      problema: 'Calma burocratica hasta que se me ocurra una idea,',
      consejo: 'Nada mejor que una buena muerte para terminar una historia.'
    },
    dialogoInicial: 'Perdón por la tardanza, estaba contando los fondos de la Asociación. ¿Vienes a aportar al gremio o a buscar problemas?',
    opciones: [
      {
        id: 'abrir_tienda_guillermo',
        texto: '⚔️ Abrir Forja & Armería de Guillermo y Javier',
        accion: 'abrir_tienda_guillermo',
        respuesta: '¡Acá tenés el arsenal oficial! Espadas, cotas de mallas, armaduras de placas y hachas afiladas.'
      },
      {
        id: 'donar',
        texto: 'Aportar 20 Monedas de Oro al Fondo Común',
        costoOro: 20,
        accion: 'aportar_gremio',
        respuesta: '¡Excelente aporte patriótico! Con esto las cuentas cierran y el gremio prospera.'
      },
      {
        id: 'descuento',
        texto: '¿Me haces un descuento en la tasa de rescate?',
        accion: 'dialogo_regateo',
        respuesta: '¡¡¡RAJA DE ACÁ!!! ¡¿Descuentos en plena mazmorra?! Mirá, con mi suerte con los dados, si te hago descuento nos fundimos todos.'
      },
      {
        id: 'consejo',
        texto: '¿Qué consejo me das para no morir abajo?',
        accion: 'dialogo_consejo',
        respuesta: 'No te puedo negar que se veía venir... pero mira: nada mejor que una buena muerte para terminar una historia.'
      },
      {
        id: 'salir',
        texto: 'Guardar billetera y salir',
        accion: 'cerrar'
      }
    ]
  },

  ayrton: {
    id: 'ayrton',
    nombre: 'Ayrton',
    cargo: 'El Bárbaro Mercenario',
    subtitulo: 'Vocal Suplente & Fuerza Bruta',
    gremio: 'Asociación de Rol La Pampa',
    spritePrefijo: 'npc_ayrton',
    pitchVoz: 320,
    colorTema: '#ef4444',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    descripcion: 'Guerrero imponente que resuelve todo con contundencia. Cree firmemente que ningún problema resiste un buen hachazo.',
    respuestasOriginales: {
      saludo: 'Alojaaa.',
      muerteAbsurda: 'Tranqui, no sos el único con 0 sentido de supervivencia, un error no determina tus resultados',
      regateo: 'A bueee. ¿Te querés morir ahora?',
      muletilla: 'Podría ser peor.',
      problema: '¡Nada que puedas solucionar golpeando más fuerte!',
      consejo: '¿Compraste soga?'
    },
    dialogoInicial: '¡Alojaaa! Estoy descansando un rato sobre el filo de mi hacha. ¿Necesitas músculo o consejos de supervivencia?',
    opciones: [
      {
        id: 'buff_fuerza',
        texto: 'Contratar Entrenamiento de Furia (+50% Daño por 60s) - 40 Oro',
        costoOro: 40,
        accion: 'buff_fuerza',
        respuesta: '¡Esa es la actitud! ¡Nada que no puedas solucionar golpeando más fuerte! ¡Rómpeles los huesos a esos esqueletos!'
      },
      {
        id: 'regatear',
        texto: '¿Me cobras menos por la ayuda?',
        accion: 'dialogo_regateo',
        respuesta: 'A bueee. ¿Te querés morir ahora? Mi hacha no hace descuentos, compañero.'
      },
      {
        id: 'consejo',
        texto: '¿Algún truco para la mazmorra?',
        accion: 'dialogo_consejo',
        respuesta: '¿Compraste soga?... Podría ser peor, pero tranquilo: no sos el único con 0 sentido de supervivencia, un error no determina tus resultados.'
      },
      {
        id: 'salir',
        texto: 'Chau Ayrton',
        accion: 'cerrar'
      }
    ]
  },

  mati: {
    id: 'mati',
    nombre: 'Matías',
    cargo: 'El Presidente Supremo de la Mazmorra',
    subtitulo: 'Presidente - Asociación de Rol La Pampa',
    gremio: 'Presidencia - Asociación de Rol La Pampa',
    spritePrefijo: 'npc_mati',
    pitchVoz: 360,
    colorTema: '#8b5cf6',
    badgeColor: 'bg-purple-600/20 text-purple-300 border-purple-600/40',
    descripcion: 'El líder máximo que aguarda en lo más profundo de la Cripta West Marches y vela por el gremio en el santuario. Pragmático, estratega y maestro de las tiradas decisivas.',
    respuestasOriginales: {
      saludo: 'Cómo dice que le va a la gente , buenasss',
      muerteAbsurda: 'Buenas decisiones...',
      regateo: 'A ver tira dado..',
      muletilla: 'Las cosas',
      problema: 'Busco la solución práctica',
      consejo: 'Están seguros que van a hacer eso?'
    },
    dialogoInicial: 'Cómo dice que le va a la gente, buenasss. Aquí supervisando que todo marche con orden en la mazmorra. ¿Están seguros que van a hacer eso?',
    opciones: [
      {
        id: 'consejo',
        texto: '¿Qué consejo nos das como presidente para sobrevivir?',
        accion: 'dialogo_consejo',
        respuesta: '¿Están seguros que van a hacer eso?... Las cosas se piensan dos veces. Busco la solución práctica: vayan en grupo, no se separen y cuiden el oro.'
      },
      {
        id: 'regatear',
        texto: '¿Nos puedes autorizar un descuento gremial?',
        accion: 'dialogo_regateo',
        respuesta: 'A ver tira dado.. *te mira fijamente*. Las cosas son como son: en esta Asociación nadie tiene coronita ni precios mágicos.'
      },
      {
        id: 'muerte',
        texto: 'Acabamos de perder a un aventurero en una trampa...',
        accion: 'dialogo_muerte',
        respuesta: 'Buenas decisiones... *niega lentamente*. Las cosas pasan por apurarse. Que pase por la secretaría de Martín a firmar el acta.'
      },
      {
        id: 'salir',
        texto: 'Gracias Matías',
        accion: 'cerrar'
      }
    ],
    dialogoVictoria: 'Buenas decisiones... pero no las suficientes. Vuelve a tirar dados.',
    dialogoDesafio: 'A ver tira dado.. Busco la solución práctica: derrotarte aquí mismo.'
  },

  keith: {
    id: 'keith',
    nombre: 'Keith',
    cargo: 'La Jueza de los Dados & Reliquias',
    subtitulo: 'Maestra de Azar & Arbitraje',
    gremio: 'Asociación de Rol La Pampa',
    spritePrefijo: 'npc_keith',
    pitchVoz: 480,
    colorTema: '#ec4899', // Rosa místico
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    descripcion: 'Pone a prueba el rol de los aventureros. Si sabes rolear, los dados te favorecen; si intentas trampas, el castigo es inmediato.',
    respuestasOriginales: {
      saludo: 'Holiii',
      muerteAbsurda: '¡Ay! que pena',
      regateo: 'Si es roleable, tiene que rolear y sacar buenos dados, si no es roleable, penalización (más caro, desfavorable)',
      muletilla: 'He estado mejor pero también peor, así que no me quejo',
      problema: 'Buscando solución práctica que pueda satisfacer a ambas partes.',
      consejo: 'No querés hacer eso'
    },
    dialogoInicial: '¡Holiii! ¿Cómo estás? He estado mejor pero también peor, así que no me quejo. ¿Vienes a tentar a la suerte?',
    opciones: [
      {
        id: 'tirar_dados',
        texto: 'Tirar el Dado del Destino (d20) - 20 Oro',
        costoOro: 20,
        accion: 'tirar_dados_keith',
        respuesta: 'Si es roleable, tiene que rolear y sacar buenos dados... ¡Veamos qué dictamina el d20!'
      },
      {
        id: 'regatear',
        texto: '¿No me cobras los 20 de oro?',
        accion: 'dialogo_regateo',
        respuesta: 'Si no es roleable, penalización: te va a salir más caro por querer saltarte las reglas.'
      },
      {
        id: 'consejo',
        texto: '¿Me lanzo directo a la sala del jefe?',
        accion: 'dialogo_consejo',
        respuesta: '"No querés hacer eso". Busquemos una solución práctica que pueda satisfacer a ambas partes antes de que termines en el piso.'
      },
      {
        id: 'salir',
        texto: 'Hasta luego Keith',
        accion: 'cerrar'
      }
    ]
  },

  javier: {
    id: 'javier',
    nombre: 'Javier',
    cargo: 'El Táctico del Gremio & Maestro de Escape',
    subtitulo: 'Estrategia, Evasión & Consejos Cínicos',
    gremio: 'Asociación de Rol La Pampa',
    spritePrefijo: 'npc_javi',
    pitchVoz: 390,
    colorTema: '#10b981', // Verde táctico
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    descripcion: 'Estratega pragmático de la mazmorra. Sabe que hay un millón de formas de equivocarse y que correr a tiempo salva vidas.',
    respuestasOriginales: {
      saludo: 'Buenas y santas!',
      muerteAbsurda: 'Y bueno... ni los dados quisieron salvarte.',
      regateo: 'Que interesante punto de vista. Pero ese es TU punto de vista.',
      muletilla: 'Tenes mil formas de hacerlo bien, pero un millón de formas de hacerlo mal.',
      problema: 'Buscarle la vuelta graciosa para intentar desactivar la situación lo mas posible, no siempre funciona.',
      consejo: 'Y recuerda, correr es siempre una opción.'
    },
    dialogoInicial: '¡Buenas y santas! Tenés mil formas de hacerlo bien, pero un millón de formas de hacerlo mal. ¿Qué plan traes en mente?',
    opciones: [
      {
        id: 'buff_velocidad',
        texto: 'Lección Táctica: Botas de Evasión (+30% Velocidad por 60s) - 25 Oro',
        costoOro: 25,
        accion: 'buff_velocidad',
        respuesta: '¡Buena elección! Y recuerda, correr es siempre una opción válida cuando las cosas se ponen feas.'
      },
      {
        id: 'regatear',
        texto: 'Tu precio me parece excesivo...',
        accion: 'dialogo_regateo',
        respuesta: 'Qué interesante punto de vista. Pero ese es TU punto de vista. La táctica cuesta lo que vale.'
      },
      {
        id: 'consejo',
        texto: '¿Qué hago si me rodean muchos enemigos?',
        accion: 'dialogo_consejo',
        respuesta: 'Y bueno... ni los dados quisieron salvarte si te regalás así. Intentá buscarle la vuelta graciosa para desactivar la situación... y si no funciona, ¡corré!'
      },
      {
        id: 'salir',
        texto: 'Gracias Javier',
        accion: 'cerrar'
      }
    ]
  },

  strerbern: {
    id: 'strerbern',
    nombre: 'Víctor "Strerbern"',
    cargo: 'El Archmago & Dungeon Master',
    subtitulo: 'Arquitecto de la Cripta & Diseñador de Reglas',
    gremio: 'Dungeon Master - Asociación de Rol La Pampa',
    spritePrefijo: 'npc_strerbern',
    pitchVoz: 400,
    colorTema: '#6366f1', // Indigo místico
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    descripcion: 'El creador de las catacumbas. Observa el destino de los aventureros tras la pantalla de DM, tirando dados y calibrando el peligro detrás de la penumbra.',
    respuestasOriginales: {
      saludo: 'Bienvenidos a la Cripta de la Espora...',
      muerteAbsurda: 'El d20 no perdona a los que no tienen sentido de supervivencia.',
      regateo: 'La magia de la mazmorra no admite regateos.',
      consejo: 'Cuiden sus armas, respeten el Santuario y jamás vayan solos.'
    },
    dialogoInicial: 'Bienvenidos a las profundidades de la Cripta. He programado cada trampa, cada monstruo y cada piso con paciencia de DM. ¿Qué secretos buscas desentrañar?',
    opciones: [
      {
        id: 'lore',
        texto: '¿Cuál es la regla de oro para vencer en esta mazmorra?',
        accion: 'dialogo_lore',
        respuesta: 'Los jefes y enemigos siempre van a tener el valor de desafío calibrado para una party de 4 aventureros. Si algún valiente quiere ir solo, se dará cuenta a la fuerza de que necesita un grupo. ¡Cooperación ante todo!'
      },
      {
        id: 'sonido',
        texto: '¿Cómo funciona la acústica retro de este lugar?',
        accion: 'dialogo_audio',
        respuesta: 'Cada blip de diálogo, cada golpe, paso y fanfarria se sintetiza en tiempo real mediante Web Audio API en ondas cuadradas y triangulares de 8 bits sin dependencias pesadas.'
      },
      {
        id: 'salir',
        texto: 'Continuar la aventura',
        accion: 'cerrar'
      }
    ]
  }
};
