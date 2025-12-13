import type { Turma, Horario, } from './turmas'
import { parseHorario } from './turmas'

const MATERIAS_URL = '/sigcal/materiasv2.json'

type MateriaJson = {
  cod: string;
  nome: string;
  turmas: {
    n: string;
    professor: string;
    horario: string;
  }[];
  horario: string;
  periodo: number;
  obrigatoria: boolean;
}

function sdbm(str: string) {
  let hashCode = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hashCode = char + (hashCode << 6) + (hashCode << 16) - hashCode;
  }
  return hashCode;
};

const saturationRange = [10, 100] as const
const lightnessRange = [55, 85] as const

function genColor(nome: string) {
  const hash = Math.abs(sdbm(nome))
  return `hsl(${hash % 181}, ${
    (hash ** 2 % (saturationRange[1] - saturationRange[0])) + saturationRange[0]
  }%, ${
    (hash * 3 % (lightnessRange[1] - lightnessRange[0])) + lightnessRange[0]
  }%) /* ${hash} */`
}

export class Materia {
  cod: string;
  nome: string;
  turmas: (Turma & {selected: boolean})[];
  professores: string[];
  horarios: Horario[];
  color: string;
  periodo: number;
  obrigatoria: boolean;
  constructor(obj: MateriaJson) {
    this.cod = obj.cod
    this.nome = obj.nome
    this.turmas = $state(obj.turmas.map(t => ({
      selected: false,
      n: t.n,
      professor: t.professor,
      horarios: parseHorario(t.horario),
      horarioStr: t.horario,
    })))
    this.professores = $derived(this.turmas.map(t => t.professor))
    this.horarios = $derived(this.turmas.flatMap(t => t.horarios))
    this.color = genColor(this.nome)
    this.periodo = obj.periodo
    this.obrigatoria = obj.obrigatoria
  }

  filtrarTurmasPorHorario({dia, hora}: {dia: number, hora: number}) {
    const turmas = this.turmas.filter(t =>
      t.horarios.some(h =>
        h.dia === dia && h.from <= hora && h.to > hora
      )
    )
    return new Proxy(this, {
      get: function(obj, prop: keyof Materia) {
        if (prop === 'turmas') {
          return turmas
        }
        return obj[prop]
      }
    })
  }

  filtroPesquisa(search: string): boolean {
    return procuraSubstring(this.nome, search) || this.professores.some(p => procuraSubstring(p, search))
  }
}

function procuraSubstring(str1: string, str2: string) {
  return str1.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().includes(
    str2.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
  )
}

export async function fetchMaterias(): Promise<{horaAtualizado: string, materias: Materia[]} | undefined> {
  const res = await fetch(MATERIAS_URL)
  if (res.ok) {
    const j = (await res.json()) as {horaAtualizado: string, materias: MateriaJson[]}
    return { horaAtualizado: j.horaAtualizado, materias: j.materias.map(m => new Materia(m)) }
  }
  console.error('Não foi possível acessar matérias.')
}

