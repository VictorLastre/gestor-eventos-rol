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
    descripcion: 'Dibuja con precisión milimétrica los 100 niveles de la cripta. Odia que manchen sus pergaminos con sangre de trasgo.',
    respuestasOriginales: {
      saludo: 'Hey!',
      muerteAbsurda: 'Eso te pasa por andar jodiendo',
      regateo: '*Risa* El/ella juraaa',
      muletilla: 'Gonorrea (xD)',
      problema: '*Silencio Incómodo* ¿Ya? O ¿van a seguir? (?)',
      consejo: 'Quizás es momento de tu evento canónico... Pero, si quieres un consejo: No hagas eso.'
    },
    dialogoInicial: '¡Hey! Mira el desastre de mapa que tienes... ¿quieres que te lo arregle o vas a seguir perdiéndote en los pasillos?',
    opciones: [
      {
        id: 'mapa_seguridad',
        texto: 'Trazar Hoguera y Escalera en el Mapa (25 Oro)',
        costoOro: 25,
        accion: 'revelar_seguridad',
        respuesta: 'Listo, te marqué con runas celestes el Santuario y la Escalera del Jefe. Al menos así no morirás dando vueltas como pollo sin cabeza.'
      },
      {
        id: 'mapa_completo',
        texto: 'Revelar Todo el Mapa del Piso Actual (75 Oro)',
        costoOro: 75,
        accion: 'revelar_completo',
        respuesta: '¡Aquí tienes el plano completo de este nivel! No lo manches con restos de esqueleto, me tomó horas secar la tinta.'
      },
      {
        id: 'consejo',
        texto: '¿Qué me recomiendas antes de entrar a la sala del jefe?',
        accion: 'dialogo_consejo',
        respuesta: 'Quizás es momento de tu evento canónico... Pero, si quieres un consejo: No hagas eso. (Y si vas igual, no ataques a través de los barrotes, ¡Gonorrea! xD)'
      },
      {
        id: 'regatear',
        texto: '¿Me haces una rebajita de gremio por ser socio?',
        accion: 'dialogo_regateo',
        respuesta: '*Risa burlona* ¿Rebaja en medio de una mazmorra de 100 pisos?... ¡El juraaa! Pagá lo que vale el mapa, ¡Gonorrea! (xD)'
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
    cargo: 'El Ángel Fiscal de la Muerte',
    subtitulo: 'Secretaría de Actas & Registro de Bajas',
    gremio: 'Asociación de Rol La Pampa',
    spritePrefijo: 'npc_angel',
    pitchVoz: 400,
    colorTema: '#fbbf24', // Dorado celestial
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    descripcion: 'Aparece en un destello celestial con una pluma y un libro de actas cada vez que un aventurero cae en combate.',
    generarJuicioMuerte: (armaRota, oroPerdido, expulsado, piso) => {
      if (armaRota) {
        return {
          titulo: '⚖️ ¡ACTA DISCIPLINARIA DEL ÁNGEL SECRETARIO!',
          mensaje: '¡Otra vez atacando con la espada partida! En el acta número 14 de la Asociación quedó asentado que las armas se afilan en la forja antes de enfrentar a los horrores de la cripta. Has sido devuelto al santuario.'
        };
      }
      if (expulsado) {
        return {
          titulo: '⚠️ ¡EXPULSIÓN POR FALTA DE REGISTRO!',
          mensaje: `Caíste en combate sin haber descubierto el Santuario del Piso ${piso}. Por normativa administrativa, eres retrotraído al Santuario del Piso ${piso - 1}.`
        };
      }
      return {
        titulo: '📜 ¡JUICIO ADMINISTRATIVO DEL GREMIO!',
        mensaje: `Un intento noble, pero administrativamente deficiente. La Asociación te aplica un cargo de ${oroPerdido} monedas para el fondo de rescates y te permite reincorporarte a la hoguera.`
      };
    }
  }
};
