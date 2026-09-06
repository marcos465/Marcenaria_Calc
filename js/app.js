/**
 * js/app.js
 * Entrypoint e Orquestrador Principal do MarcenariaCalc
 * 
 * Responsável por conectar o modelo de estado (FurnitureState), as engines
 * de cálculo (cuttingList, hardwareList), as interfaces de exibição
 * (triagemFormUI, cutListUI) e os utilitários de I/O (csvExporter).
 *
 * Projeto: MarcenariaCalc (100% Client-side)
 * Engenharia de Integração & I/O
 */

import { FurnitureState } from './models/FurnitureState.js';
import { generateCuttingList } from './modules/engine/cuttingList.js';
import { generateHardwareList } from './modules/engine/hardwareList.js';
import { TriagemFormUI } from './modules/display/triagemFormUI.js';
import { CutListUI } from './modules/display/cutListUI.js';
import { exportToCutListCSV } from './utils/csvExporter.js';

/**
 * Estado global da aplicação, instâncias da UI e cache de cálculo.
 */
let furnitureState = null;
let triagemFormUI = null;
let cutListUI = null;
let lastCalculatedCutList = [];

/**
 * Orquestrador principal do fluxo de dados (Fluxo Unidirecional).
 * Coleta os dados de estado, executa as engines de cálculo e atualiza a View.
 */
function recalculateApp() {
  try {
    // 1. Coleta o estado atual do móvel
    const stateData = furnitureState.getState();

    // 2. Processa o plano de corte e a lista de ferragens pelas engines
    const cutList = generateCuttingList(stateData);
    const hardwareList = generateHardwareList(stateData);

    // Cache local para exportação CSV
    lastCalculatedCutList = cutList || [];

    // 3. Atualiza a interface do usuário com os resultados atualizados
    if (cutListUI && typeof cutListUI.render === 'function') {
      cutListUI.render(lastCalculatedCutList, hardwareList);
    }
  } catch (error) {
    console.error('[MarcenariaCalc] Erro durante o recalculo da aplicação:', error);
  }
}

/**
 * Manipulador do evento de exportação CSV para o CutList Optimizer.
 *
 * @param {Event} event - Evento nativo do clique do botão.
 */
function handleExportCSV(event) {
  if (event) {
    event.preventDefault();
  }

  if (!lastCalculatedCutList || lastCalculatedCutList.length === 0) {
    alert('Nenhum plano de corte gerado para exportação. Preencha os dados do formulário.');
    return;
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `plano-de-corte-marcenariacalc-${timestamp}.csv`;

  exportToCutListCSV(lastCalculatedCutList, filename);
}

/**
 * Inicialização segura da aplicação após o carregamento do DOM.
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Inicialização da fonte da verdade de dados
    furnitureState = new FurnitureState();

    // Inicialização do gerenciador de renderização e exibição das listas
    cutListUI = new CutListUI('#cut-list-container', '#hardware-list-container');

    // Inicialização do formulário de triagem, vinculando o callback de recalculo reativo
    triagemFormUI = new TriagemFormUI({
      formSelector: '#triagem-form',
      state: furnitureState,
      onChange: recalculateApp
    });

    // Vinculação do botão de exportação CSV
    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', handleExportCSV);
    }

    // Executa a primeira computação para exibir os valores iniciais na UI
    recalculateApp();

    console.log('[MarcenariaCalc] Sistema inicializado e integrado com sucesso.');
  } catch (error) {
    console.error('[MarcenariaCalc] Falha crítica durante a inicialização do app:', error);
  }
});
