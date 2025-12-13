import { writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const browser = await puppeteer.launch({
  executablePath: process.env.DEFAULT_BROWSER,
  headless: false,
})
const page = await browser.newPage()

await page.goto('https://sigaa.ufpi.br/sigaa/public/curso/turmas.jsf?lc=pt_BR&id=74268')

await Promise.all([
  page.waitForNavigation({ waitUntil: 'networkidle2' }),
  page.click('table.formulario tfoot input[type=submit]'),
]);

await page.locator('.listagem').wait()

const materias = await page.$$eval('.listagem', elements => elements.map(elem => {
  const [ , cod, nome ] = (elem.querySelector('.subListagem a') as HTMLAnchorElement).innerText.match(/(\S+)\s-\s(.*)/)!
  return {
    cod,
    nome, 
    turmas: ([...elem.querySelectorAll('tbody tr')] as HTMLTableRowElement[]).map(row => ({
      n: (row.querySelector('td[align="center"]') as HTMLTableColElement)?.innerText,
      professor: (row.querySelector('td.nome') as HTMLTableColElement)?.innerText,
      horario: (row.querySelector('td.horario') as HTMLTableColElement)?.innerText,
    })),
    periodo: null as number | null,
    obrigatoria: null as boolean | null
  }}))

const mats = materias.reduce((acc, cur) => {
  acc[cur.cod] = cur
  return acc
}, {} as Record<string, (typeof materias)[number]>)


// Currículo de 2019
await page.goto('https://sigaa.ufpi.br/sigaa/link/public/curso/curriculo/28768340')

await page.locator('table.formulario td[colspan="2"] table tbody tr').wait()

page.on('console', msg => console.log('PAGE LOG:', msg.text()));

const specs = await page.$$eval('table.formulario td[colspan="2"] table tbody tr', elements => {
  let curPer: number = 0
  let acc = {} as Record<string, {nome: string, periodo: number, obrigatoria: boolean, horas: string}>;
  (elements as HTMLTableRowElement[]).forEach((cur) => {
    if (cur.classList.contains('tituloRelatorio')) {
      curPer = parseInt(cur.innerText.match(/(\d+).\sPeríodo/)![1])
    } else if (cur.classList.contains('componentes')) {
      const [, cod, nome, horas] = (cur.querySelector('td:nth-of-type(1)') as HTMLTableColElement)
        .innerText.match(/(\S+)\s-\s(.+)\s-\s(\S+h)/)!
      if (!cod || !horas) {
        console.error(`Falha ao usar regex em ${(cur.querySelector('td:nth-of-type(1)') as any).innerText}`)
      }
      const obrg = (cur.querySelector('td:nth-of-type(2)') as HTMLTableColElement).innerText
      acc[cod] = {
        nome,
        periodo: curPer!,
        obrigatoria: obrg === 'Obrigatória',
        horas: horas,
      }
    }
  })
  return acc
})

function verificarString(str1: string, str2: string) {
  return str1.localeCompare(str2, 'en-US', { sensitivity: 'base' }) === 0
}

for (const cod in mats) {
  let spec = specs[cod]
  if (spec === undefined) {
    console.warn(`Matéria de código ${cod} não encontrou correspondente no currículo!`)
    console.warn(`Procurando por nome: ${mats[cod].nome}`)
    for (const i in specs) {
      if (verificarString(mats[cod].nome, specs[i].nome)) {
        spec = specs[i]
      }
    }
  }
  if (spec === undefined) {
    console.error(`Matéria de código ${cod} não encontrou correspondente no currículo por nome nem código!`)
    continue
  }
  mats[cod].periodo = spec.periodo
  mats[cod].obrigatoria = spec.obrigatoria
}

writeFileSync('materiasv2.json', JSON.stringify({
  horaAtualizado: new Date().toString(),
  materias
}, null, 2))

browser.close()
