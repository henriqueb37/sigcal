<script lang="ts">
  const rowStart = 6
  const rowEnd = 24

  function range(n: number, e?: number): number[] {
    if (e !== undefined) {
      return Array.from({length: e - n}).map((_, i) => i + n)
    } else {
      return Array.from({length: n}).map((_, i) => i)
    }
  }

  type Aula = {dia: number, from: number, to: number, id: string, nome: string, color: string}

  let { matsSelected, selection }: {matsSelected: {nome: string, color: string, aulas: Aula[]}[], selection: {selected: {dia: number, hora: number} | null}} = $props() 
  let aulas = $derived(matsSelected.flatMap(m => m.aulas))
  // let aulas = [] as Horario[]
  // let selection = {selected: null} as {selected: {dia: number, hora: number} | null}

  const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
  const horas = range(rowStart, rowEnd)

  type TimePoint = {
    dia: number,
    hora: number,
    tipo: 'START' | 'END',
    id: string,
    nome: string,
  }

  let conflitos = $derived.by(() => {
    const aulasPorDia = aulas.reduce((acc, cur) => {
      if (!acc.has(cur.dia)) {
        acc.set(cur.dia, [])
      }
      acc.get(cur.dia)!.push(cur)
      return acc
    }, new Map<number, Aula[]>())

    const conflitos = [] as {
      eventos: string[],
      from: number,
      to: number,
      dia: number,
    }[]
    aulasPorDia.forEach((events, dia) => {
      const timePoints: TimePoint[] = events.flatMap(e => [
        {dia: e.dia, hora: e.from, tipo: 'START', id: e.id, nome: e.nome},
        {dia: e.dia, hora: e.to, tipo: 'END', id: e.id, nome: e.nome},
      ])

      timePoints.sort((a,b) => {
        if (a.hora !== b.hora) return a.hora - b.hora
        return a.tipo === 'END' ? -1 : 1
      })

      const eventosAtivos = new Set<string>()
      let prevHora = -1
      for (const point of timePoints) {
        if (point.hora > prevHora && eventosAtivos.size > 1) {
          conflitos.push({
            eventos: Array.from(eventosAtivos).sort(),
            from: prevHora,
            to: point.hora,
            dia: dia,
          })
        } 

        if (point.tipo === 'START') {
          eventosAtivos.add(point.id)
        } else {
          eventosAtivos.delete(point.id)
        }

        prevHora = point.hora
      }
    })
    return conflitos
  })

  function handleCellClick(dia: number, hora: number) {
    // console.debug(`Click! Dia ${dia}, hora ${hora}`)
    if (selection.selected?.dia !== dia || selection.selected?.hora !== hora) {
      selection.selected = {dia, hora}
    } else {
      selection.selected = null
    }
  }
</script>

<div class="calendarContainer">
  <div class="calendario">
    <div class="gridCorner"></div>
    <div class="gridHeader">
      {#each diasSemana as dia}
        <div class="dia">{dia.slice(0, 3).toUpperCase()}</div>
      {/each}
    </div>
    <div class="gridSidebar">
      {#each horas as hora}
        <div class="hora">
          <span class="horaText">{hora}:00</span>
        </div>
      {/each}
    </div>
    <div class="gridContent">
      <div class="layerBack">
        {#each horas as hora}
          {#each diasSemana as dia, diaIndex}
            <button
              class="backCell"
              class:selected={selection.selected?.dia === diaIndex + 1 && selection.selected?.hora === hora}
              onclick={() => handleCellClick(diaIndex + 1, hora)}
              aria-label={`Dia ${dia}, Hora ${hora}`}
            ></button>
          {/each}
        {/each}
      </div>
      <div class="layerEvents">
        {#each aulas as event}
          <div
            class="event"
            style={`grid-area: ${event.from - rowStart + 1} / ${event.dia} / span ${event.to - event.from}; background: ${event.color}`}
          >
            {event.nome}
          </div>
        {/each}
      </div>
      <div class="layerConflicts">
        {#each conflitos as event}
          <div
            class="conflict"
            style={`grid-area: ${event.from - rowStart + 1} / ${event.dia} / span ${event.to - event.from};`}
          >
            <div class="text">{event.eventos.length} TURMAS EM CONFLITO!</div>
            <div class="tooltip"><strong>TURMAS EM CONFLITO</strong>: {event.eventos.join(', ')}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .calendarContainer {
    flex-grow: 2;
  }
  .calendario {
    --grid-rows: repeat(18, 1fr);
    --grid-cols: repeat(7, 1fr);
    --grid-gap: 1px;
    display: grid;
    gap: var(--grid-gap);
    grid-template-rows: 2rem 1fr;
    grid-template-columns: 3rem 1fr;
  }
  .gridCorner {
    grid-area: 1 / 1;
  }
  .gridHeader {
    display: grid;
    gap: var(--grid-gap);
    grid-area: 1 / 2;
    width: 100%;
    height: 100%;
    grid-template-rows: 1fr;
    grid-template-columns: var(--grid-cols);
    background: #333366;
  }
  .gridHeader div {
    color: var(--bg);
    text-align: center;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-weight: bold;
  }
  .gridSidebar {
    display: grid;
    gap: var(--grid-gap);
    grid-area: 2 / 1;
    width: 100%;
    height: 100%;
    grid-template-rows: var(--grid-rows);
    grid-template-columns: 1fr;
  }
  .gridContent {
    display: grid;
    grid-area: 2 / 2;
    width: 100%;
    height: 100%;
    position: relative;
    background: #555;
  }
  .layerBack, .layerEvents, .layerConflicts {
    grid-area: 1 / 1 / 1 / 1;
    /* position: absolute; */
    /* inset: 0; */
    display: grid;
    grid-template-rows: var(--grid-rows); 
    grid-template-columns: var(--grid-cols); 
    gap: var(--grid-gap);
  }
  .layerBack .backCell {
    background: var(--bg);
    border: none;
    height: 3rem;
  }
  .backCell.selected {
    background: #99f;
    border: 4px dashed #00f
  }
  .layerEvents, .layerConflicts {
    pointer-events: none;
  }
  .hora {
    position: relative;
  }
  .hora .horaText {
    position: absolute;
    top: 0;
    right: 0.2rem;
    font-size: 0.8rem;
    transform: translateY(-50%);
  }
  .layerEvents .event {
    pointer-events: auto;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
    font-size: 0.7rem;
  }
  .layerConflicts .conflict {
    position: relative;
    pointer-events: auto;
    z-index: 20;
    background: #ff0000ce;
  }
  .conflict .text {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
    font-size: 0.8rem;
    width: 100%;
    height: 100%;
  }
  .conflict .tooltip {
    display: none;
    background: #555;
    color: var(--bg);
    position: absolute;
    z-index: 30;
    font-size: 0.8rem;
    bottom: 105%;
    left: -30%;
    right: -30%;
    padding: 1em;
  }
  .conflict:hover .tooltip {
    display: block;
  }
  @media screen and (max-width: 768px) {
    .backCell {
      min-width: 5.5rem;
    }
    .calendarContainer {
      overflow-x: scroll;
    }
    .layerEvents .event {
      overflow-wrap: break-word;
      /* word-break: break-all; */
      hyphens: auto;
      text-wrap: balance;
    }
  }
</style>
