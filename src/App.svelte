<script lang="ts">
  import { onMount } from "svelte";
  import { fetchMaterias, Materia } from "./materias.svelte";
  import Calendario from "./lib/Calendar.svelte";
  import Listagem from "./lib/Listagem.svelte"

  function getAulasSelecionadas(materias: Materia[]) {
    return materias.map(m => {
      const turmas = m.turmas.filter(t => t.selected)
      if (turmas.length > 0) {
        return {
          nome: m.nome,
          color: m.color,
          aulas: turmas.flatMap(t => t.horarios.map(
            h => ({
              id: `${m.nome}[${t.n}]`,
              nome: m.nome,
              color: m.color,
              ...h
            })
          ))
        }
      }
      return undefined
    }).filter(o => o !== undefined)
  }

  let materias = $state(undefined) as {horaAtualizado: string, materias: Materia[], error?: string} | undefined
  let matsSelected = $derived(
    (materias !== undefined && materias.error === undefined)
      ? getAulasSelecionadas(materias.materias)
      : []
  )

  let selection = $state({selected: null} as {selected: {dia: number, hora: number} | null})
  let search = $state({text: ""})

  onMount(async () => {
    const res = await fetchMaterias()
    if (res) {
      materias = {...res}
    } else {
      materias = {horaAtualizado: '', materias:[], error: "Error"}
    }
  })
</script>

<main>
  <div class="container">
    {#if !materias}
      <p>Buscando matérias...</p>
    {:else if materias.error !== undefined}
      <p>Erro ao procurar matérias.</p>
    {:else}
      <div class="content">
        <Calendario {matsSelected} {selection} />
        <Listagem {selection} {search} materias={materias.materias} />
      </div>
      <div class="info">Atualizado em: {materias?.horaAtualizado}</div>
    {/if}
  </div>
</main>

<style>
  main {
    width: 100rem;
    margin: auto;
    padding: 2rem;
    box-shadow: #0009 1px 5px 10px;
  }
  main .container .content {
    display: flex;
    flex-direction: row;
    gap: 2rem;
  }
  .info {
    font-size: 0.6rem;
  }
  @media screen and (max-width: 768px) {
    main {
      width: 100vw;
    }
    main .container .content {
      flex-direction: column;
    }
  }
</style>
