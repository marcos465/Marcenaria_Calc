/**
 * js/utils/csvExporter.js
 * Módulo utilitário para conversão e exportação de listas de corte no formato CSV
 * compatível com o software CutList Optimizer.
 *
 * Projeto: MarcenariaCalc (100% Client-side)
 * Engenharia de Integração & I/O
 */

/**
 * Sanitiza e converte um valor para um número válido, aplicando fallback seguro para 0.
 *
 * @param {*} value - Valor a ser validado/sanitizado.
 * @return {number} Número válido ou 0 em caso de entrada inválida.
 */
function sanitizeNumber(value) {
  const parsed = Number(value);
  return isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
}

/**
 * Escapa strings para formatação CSV segura, tratando aspas duplas, vírgulas e quebras de linha.
 *
 * @param {*} value - Valor a ser formatado como célula CSV.
 * @return {string} Valor devidamente escapado.
 */
function formatCSVCell(value) {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value).trim();
  // Se contiver aspas duplas, vírgulas ou quebra de linha, escapa as aspas e envolve a célula em aspas
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converte um array de peças de corte no formato CSV compatível com o CutList Optimizer.
 *
 * Contrato do CutList Optimizer:
 * Cabeçalho: Length,Width,Qty,Material,Enabled,Label
 *
 * Regras aplicadas:
 * - Length: Sempre o MAIOR valor entre as dimensões da peça.
 * - Width: Sempre o MENOR valor entre as dimensões da peça.
 * - Inclusão da assinatura BOM UTF-8 (\uFEFF) para compatibilidade com Excel.
 *
 * @param {Array<Object>} cuttingList - Array de objetos contendo os dados das peças.
 * @return {string} Conteúdo em texto formatado como CSV com BOM UTF-8.
 * @throws {Error} Se a lista estiver vazia ou com tipo inválido.
 */
export function convertToCutListCSV(cuttingList) {
  if (!Array.isArray(cuttingList) || cuttingList.length === 0) {
    throw new Error('Nenhum dado disponível na lista de corte para conversão em CSV.');
  }

  // Cabeçalho exato exigido pelo CutList Optimizer
  const headers = ['Length', 'Width', 'Qty', 'Material', 'Enabled', 'Label'];
  const rows = [headers.join(',')];

  for (const item of cuttingList) {
    if (!item || typeof item !== 'object') continue;

    // Extração e sanitização das dimensões com fallback seguro para 0
    const rawDim1 = sanitizeNumber(item.length ?? item.comprimento ?? item.dim1);
    const rawDim2 = sanitizeNumber(item.width ?? item.largura ?? item.dim2);

    // Regra de Negócio Anti-Inversão: Length = MAX, Width = MIN
    const length = Math.max(rawDim1, rawDim2);
    const width = Math.min(rawDim1, rawDim2);

    // Sanitização e validação das demais propriedades
    const qty = sanitizeNumber(item.quantity ?? item.quantidade ?? item.qty ?? 1);
    const material = item.material || 'MDF 15mm';
    const enabled = item.enabled !== undefined ? Boolean(item.enabled) : true;
    const label = item.label || item.name || item.nome || 'Peça';

    // Montagem e escape dos campos da linha
    const row = [
      length,
      width,
      qty,
      formatCSVCell(material),
      enabled ? 'true' : 'false',
      formatCSVCell(label)
    ];

    rows.push(row.join(','));
  }

  // Retorna com a assinatura BOM UTF-8 no início do conteúdo
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Dispara o download nativo client-side de uma string CSV via Blob e URL.createObjectURL.
 *
 * @param {string} csvContent - Conteúdo em texto do arquivo CSV.
 * @param {string} [filename='plano-de-corte-marcenariacalc.csv'] - Nome do arquivo a ser baixado.
 */
export function downloadCSVFile(csvContent, filename = 'plano-de-corte-marcenariacalc.csv') {
  if (!csvContent || typeof csvContent !== 'string') {
    console.warn('[csvExporter] Tentativa de download com conteúdo inválido ou vazio.');
    return;
  }

  // Garante extensão .csv no nome do arquivo
  const safeFilename = filename.toLowerCase().endsWith('.csv') ? filename : `${filename}.csv`;

  // Criação do Blob com MIME type explícito para CSV UTF-8
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);

  // Instanciação temporária do elemento <a> para trigger do download nativo
  const downloadLink = document.createElement('a');
  downloadLink.href = objectUrl;
  downloadLink.setAttribute('download', safeFilename);
  downloadLink.style.display = 'none';

  document.body.appendChild(downloadLink);
  downloadLink.click();

  // Limpeza do DOM e revogação do Object URL para liberação de memória
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(objectUrl);
}

/**
 * Função orquestradora principal do módulo.
 * Recebe a lista de peças do CuttingListEngine, converte para o formato CutList Optimizer
 * e dispara o download do arquivo no navegador.
 *
 * @param {Array<Object>} cuttingList - Array de objetos contendo a lista de corte.
 * @param {string} [filename='plano-de-corte-marcenariacalc.csv'] - Nome customizado do arquivo.
 * @return {boolean} Retorna true se a exportação for concluída com sucesso.
 */
export function exportToCutListCSV(cuttingList, filename = 'plano-de-corte-marcenariacalc.csv') {
  try {
    const csvContent = convertToCutListCSV(cuttingList);
    downloadCSVFile(csvContent, filename);
    return true;
  } catch (error) {
    console.error('[csvExporter] Falha ao exportar lista de corte para CSV:', error.message);
    alert(`Erro ao exportar o arquivo CSV: ${error.message}`);
    return false;
  }
}

/**
 * Exportação padrão da classe utilitária orientada a métodos estáticos.
 */
export class CSVExporter {
  /**
   * Converte o array para string CSV formatada.
   */
  static convert(cuttingList) {
    return convertToCutListCSV(cuttingList);
  }

  /**
   * Executa o disparo do download do arquivo.
   */
  static download(csvContent, filename) {
    downloadCSVFile(csvContent, filename);
  }

  /**
   * Orquestra todo o fluxo de exportação.
   */
  static export(cuttingList, filename) {
    return exportToCutListCSV(cuttingList, filename);
  }
}
