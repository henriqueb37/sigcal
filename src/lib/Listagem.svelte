<script lang="ts">
  import type { Materia } from "../materias.svelte";
  type Props = {
    selection: {selected: {dia: number, hora: number} | null},
    search: {text: string},
    materias: Materia[]
  }
  let { selection, search, materias }: Props = $props()

  const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

  let filtered = $derived.by(() => {
    let fil = materias
    if (selection.selected !== null) {
      fil = fil.map(m => m.filtrarTurmasPorHorario(selection.selected!)).filter(m => m.turmas.length > 0)
    }
    if (search.text !== "") {
      fil = fil.filter(m => m.filtroPesquisa(search.text))
    }
    return fil
  })

  let grouped = $derived(filtered.reduce((acc, cur) => {
    if (acc[cur.periodo] === undefined) {
      acc[cur.periodo] = []
    }
    acc[cur.periodo].push(cur)
    return acc
  }, {} as Record<number, Materia[]>))
</script>


<div class="listaMaterias">
  <input type="search" bind:value={search.text} placeholder="Pesquisar" />
  <div class="filtroInfo">
    {#if selection.selected}
      <strong>Filtrando:</strong> Dia {diasSemana[selection.selected.dia - 1]}, Hora {selection.selected.hora}
    {/if}
  </div>
  <div class="listagem">
    {#each Object.entries(grouped) as [periodo, materias]}
      <details class="periodo">
        <summary>{periodo}º Período</summary>
        {#each materias as materia}
          <details class="materia" class:opt={!materia.obrigatoria} open={materia.turmas.length < 4 ? true : undefined}>
            <summary>{materia.nome} {#if !materia.obrigatoria}(Opt.){/if}</summary>
            <div class="turmasContainer">
              {#each materia.turmas as turma (`${materia.nome}[${turma.n}]`)}
                <label for={`${materia.nome}[${turma.n}]-check`}>
                  <div class="turma">
                    <input type="checkbox" id={`${materia.nome}[${turma.n}]-check`} bind:checked={turma.selected} />
                    <span class="professor">{turma.professor}</span>
                    <span class="horario">{turma.horarioStr}</span>
                  </div>
                </label>
              {/each}
            </div>
          </details>
        {/each}
      </details>
    {/each}
  </div>
</div>

<style>
  .listaMaterias {
    overflow-y: scroll;
    width: 30%;
    min-width: 500px;
    padding: 2rem;
    box-shadow: #0006 1px 3px 10px;
  }
  .materia.opt {
    color: #777;
  }
  .turmasContainer {
    margin-left: 1rem;
    padding-left: 1rem;
    border-left: 2px solid #aaa;
  }
  .turma {
    display: flex;
    flex-direction: row;
    padding: 0.1rem 0;
  }
  .turma .professor {
    flex-grow: 2;
    margin-left: 0.8rem;
  }
  .turma .horario {
    text-align: end;
    display: flex;
    align-items: center;
  }
  details > summary {
    cursor: default;
  }
  .periodo > summary {
    font-size: 1.5rem;
    font-weight: bold;
  }
  .materia > summary {
    font-weight: bold;
  }
  input[type=search] {
    width: 100%;
    margin-bottom: 2rem;
  }
  @media screen and (max-width: 768px) {
    .listaMaterias {
      width: auto;
      min-width: unset;
    }
  }
</style>

