const OFFSET_HORAS = {
  M: 5,
  T: 11,
  N: 5,
}

export type Horario = {dia: number, from: number, to: number}
export type Turma = { n: string; professor: string; horarios: Horario[]; horarioStr: string; }

export function parseHorario(horarioStr: string): Horario[] {
  const regex = /(\d+)(\w)(\d+)/g;

  const matches = [...horarioStr.matchAll(regex)]

  if (matches.length === 0) {
    console.error(`Horário ${horarioStr} vazio ou irregular.`)
    return [];
  }

  return matches.flatMap(match => {
    const [, diaStr, turno, horaStr] = match

    const dias = diaStr.split('').map(Number)
    const horasIndices = horaStr.split('').map(Number).sort((a,b) => (a - b))

    const ranges = horasIndices.reduce((acc, curr) => {
      const last = acc[acc.length - 1]
      if (last && curr === last.end + 1) {
        last.end = curr
      } else {
        acc.push({start: curr, end: curr})
      }
      return acc
    }, [] as {start: number, end: number}[])

    const offset = OFFSET_HORAS[turno as keyof typeof OFFSET_HORAS]

    return dias.flatMap(dia => ranges.map(range => ({
      dia: dia,
      from: offset + range.start,
      to: offset + range.end + 1,
    })))
  })
}
