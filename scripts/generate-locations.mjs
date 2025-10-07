#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import https from "node:https";

const API_URL =
  "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado";

async function fetchMunicipios() {
  return new Promise((resolvePromise, rejectPromise) => {
    https
      .get(API_URL, (response) => {
        if (response.statusCode !== 200) {
          rejectPromise(
            new Error(`Falha ao carregar dados (${response.statusCode})`),
          );
          response.resume();
          return;
        }
        let raw = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          try {
            const parsed = JSON.parse(raw);
            resolvePromise(parsed);
          } catch (error) {
            rejectPromise(error);
          }
        });
      })
      .on("error", rejectPromise);
  });
}

function buildDatasets(rows) {
  const estadosMap = new Map();
  const municipiosMap = new Map();

  for (const row of rows) {
    const ufSigla = row["UF-sigla"];
    const ufNome = row["UF-nome"];
    const ufId = String(row["UF-id"]);
    const regiaoNome = row["regiao-nome"];
    const regiaoSigla = row["regiao-sigla"];

    if (!estadosMap.has(ufSigla)) {
      estadosMap.set(ufSigla, {
        sigla: ufSigla,
        nome: ufNome,
        codigo: ufId,
        regiao: regiaoNome,
        regiaoSigla,
      });
    }

    if (!municipiosMap.has(ufSigla)) {
      municipiosMap.set(ufSigla, []);
    }

    const lista = municipiosMap.get(ufSigla);
    lista.push({
      codigo: String(row["municipio-id"]),
      nome: row["municipio-nome"],
    });
  }

  const estados = Array.from(estadosMap.values()).sort((a, b) =>
    a.sigla.localeCompare(b.sigla, "pt-BR"),
  );

  const municipiosPorEstado = {};
  for (const [sigla, municipios] of municipiosMap.entries()) {
    municipios.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    municipiosPorEstado[sigla] = municipios;
  }

  return { estados, municipiosPorEstado };
}

function formatAsModule(estados, municipiosPorEstado) {
  const estadosLiteral = JSON.stringify(estados, null, 2);
  const municipiosLiteral = JSON.stringify(municipiosPorEstado, null, 2);
  const now = new Date().toISOString();

  return `// AUTO-GERADO EM ${now}\n// Fonte: IBGE - https://servicodados.ibge.gov.br/api/v1/localidades/municipios\n// Nao edite manualmente; utilize scripts/generate-locations.mjs\n\nexport interface Estado {\n  sigla: string;\n  nome: string;\n  codigo: string;\n  regiao: string;\n  regiaoSigla: string;\n}\n\nexport interface Municipio {\n  codigo: string;\n  nome: string;\n}\n\nexport const ESTADOS: ReadonlyArray<Estado> = ${estadosLiteral};\n\nexport const MUNICIPIOS_POR_ESTADO: Record<string, ReadonlyArray<Municipio>> = ${municipiosLiteral};\n\nexport function getMunicipiosByUF(uf: string): ReadonlyArray<Municipio> {\n  return MUNICIPIOS_POR_ESTADO[uf] ?? [];\n}\n`;
}

async function main() {
  const rows = await fetchMunicipios();
  const { estados, municipiosPorEstado } = buildDatasets(rows);
  const content = formatAsModule(estados, municipiosPorEstado);
  const outputPath = resolve("src", "data", "locations.ts");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, content, "utf8");
  console.log(`Arquivo gerado em ${outputPath}`);
}

main().catch((error) => {
  console.error("[generate-locations] Falha ao gerar arquivo:", error);
  process.exitCode = 1;
});

