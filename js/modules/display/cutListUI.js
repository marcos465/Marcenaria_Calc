/**
 * js/modules/display/cutListUI.js
 * Módulo de Interface para Exibição das Listas de Corte e Ferragens do MarcenariaCalc.
 * 
 * Responsável por receber os dados calculados de corte (CuttingList) e ferragens (HardwareList),
 * aplicar higienização rigorosa contra XSS e renderizar tabelas responsivas no DOM.
 */

/**
 * Higieniza strings para prevenir vulnerabilidades de Cross-Site Scripting (XSS).
 * @param {string|number} str - Valor a ser higienizado.
 * @returns {string} String com caracteres especiais codificados em entidades HTML.
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  const stringified = String(str);
  return stringified.replace(/[&<>"']/g, (match) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return escapeMap[match];
  });
}

/**
 * Classe responsável pela renderização e gestão visual das tabelas de corte e insumos.
 */
export class CutListUI {
  /**
   * Instancia o gerenciador visual das listas.
   * @param {string} containerId - ID do contêiner principal no DOM (padrão: 'resultContainer').
   */
  constructor(containerId = 'resultContainer') {
    this.containerId = containerId;
    this.container = null;
    this.cuttingListTableBody = null;
    this.hardwareListTableBody = null;
  }

  /**
   * Inicializa o componente preparando a estrutura base do DOM.
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`[CutListUI] Elemento #${this.containerId} não foi encontrado no DOM.`);
      return;
    }

    this._ensureLayoutStructure();
  }

  /**
   * Garante a criação dos contêineres e tabelas estruturais de resultados caso não existam.
   * @private
   */
  _ensureLayoutStructure() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="results-wrapper">
        <!-- Seção da Lista de Corte -->
        <div class="card-result-section">
          <header class="section-header">
            <h3 class="section-title">📋 Plano de Corte (Plano de Peças)</h3>
            <span class="badge-info" id="cuttingCountBadge">0 peças</span>
          </header>
          <div class="table-responsive">
            <table class="table-cutlist" aria-label="Tabela de Peças para Corte">
              <thead>
                <tr>
                  <th scope="col">Rótulo / Peça</th>
                  <th scope="col">Qtd</th>
                  <th scope="col">Comprimento (mm)</th>
                  <th scope="col">Largura (mm)</th>
                  <th scope="col">Material</th>
                  <th scope="col">Fita de Borda</th>
                </tr>
              </thead>
              <tbody id="cuttingListTableBody">
                <tr>
                  <td colspan="6" class="text-center text-muted">Nenhuma peça gerada. Informe os dados no formulário.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Seção de Ferragens e Insumos -->
        <div class="card-result-section margin-top-lg">
          <header class="section-header">
            <h3 class="section-title">🔩 Ferragens & Insumos</h3>
            <span class="badge-info" id="hardwareCountBadge">0 itens</span>
          </header>
          <div class="table-responsive">
            <table class="table-hardware" aria-label="Tabela de Ferragens e Insumos">
              <thead>
                <tr>
                  <th scope="col">Item / Descrição</th>
                  <th scope="col">Qtd</th>
                  <th scope="col">Especificação Técnica</th>
                </tr>
              </thead>
              <tbody id="hardwareListTableBody">
                <tr>
                  <td colspan="3" class="text-center text-muted">Nenhum insumo calculado.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.cuttingListTableBody = document.getElementById('cuttingListTableBody');
    this.hardwareListTableBody = document.getElementById('hardwareListTableBody');
  }

  /**
   * Renderiza a lista de peças de corte na tabela do DOM.
   * @param {Array<Object>} cuttingListItems - Coleção de peças a serem cortadas.
   */
  renderCuttingList(cuttingListItems = []) {
    if (!this.cuttingListTableBody) this.init();

    const countBadge = document.getElementById('cuttingCountBadge');
    if (countBadge) {
      const totalQuantity = cuttingListItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
      countBadge.textContent = `${totalQuantity} ${totalQuantity === 1 ? 'peça' : 'peças'}`;
    }

    if (!Array.isArray(cuttingListItems) || cuttingListItems.length === 0) {
      this.cuttingListTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted">Nenhuma peça gerada para os parâmetros informados.</td>
        </tr>
      `;
      return;
    }

    const rowsHtml = cuttingListItems.map((item) => {
      const label = escapeHTML(item.label || item.name || 'Peça sem nome');
      const quantity = escapeHTML(item.quantity ?? 1);
      const length = escapeHTML(item.length ?? item.comprimento ?? 0);
      const width = escapeHTML(item.width ?? item.largura ?? 0);
      const material = escapeHTML(item.material || item.materialType || '-');
      const edgeBanding = escapeHTML(item.edgeBanding || item.fitaBorda || 'Sem fita');

      return `
        <tr>
          <td class="font-semibold">${label}</td>
          <td><span class="badge-qty">${quantity}</span></td>
          <td>${length} mm</td>
          <td>${width} mm</td>
          <td><span class="badge-material">${material}</span></td>
          <td>${edgeBanding}</td>
        </tr>
      `;
    }).join('');

    this.cuttingListTableBody.innerHTML = rowsHtml;
  }

  /**
   * Renderiza a lista de ferragens e insumos na tabela correspondente.
   * @param {Array<Object>} hardwareListItems - Coleção de ferragens e suprimentos.
   */
  renderHardwareList(hardwareListItems = []) {
    if (!this.hardwareListTableBody) this.init();

    const countBadge = document.getElementById('hardwareCountBadge');
    if (countBadge) {
      const totalItems = hardwareListItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
      countBadge.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`;
    }

    if (!Array.isArray(hardwareListItems) || hardwareListItems.length === 0) {
      this.hardwareListTableBody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center text-muted">Nenhum insumo ou ferragem necessária.</td>
        </tr>
      `;
      return;
    }

    const rowsHtml = hardwareListItems.map((item) => {
      const name = escapeHTML(item.name || item.item || 'Insumo sem nome');
      const quantity = escapeHTML(item.quantity ?? 1);
      const specification = escapeHTML(item.specification || item.spec || item.description || '-');

      return `
        <tr>
          <td class="font-semibold">${name}</td>
          <td><span class="badge-qty">${quantity}</span></td>
          <td class="text-muted">${specification}</td>
        </tr>
      `;
    }).join('');

    this.hardwareListTableBody.innerHTML = rowsHtml;
  }

  /**
   * Atualização unificada que recebe as listas de dados e redesenha a interface em lote.
   * @param {Array<Object>} [cuttingData=[]] - Lista de peças de corte.
   * @param {Array<Object>} [hardwareData=[]] - Lista de ferragens e insumos.
   */
  update(cuttingData = [], hardwareData = []) {
    this.renderCuttingList(cuttingData);
    this.renderHardwareList(hardwareData);
  }

  /**
   * Limpa o conteúdo renderizado e restaura a interface ao estado inicial vazio.
   */
  clear() {
    if (this.cuttingListTableBody) {
      this.cuttingListTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted">Nenhuma peça gerada. Informe os dados no formulário.</td>
        </tr>
      `;
    }

    if (this.hardwareListTableBody) {
      this.hardwareListTableBody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center text-muted">Nenhum insumo calculado.</td>
        </tr>
      `;
    }

    const cuttingBadge = document.getElementById('cuttingCountBadge');
    const hardwareBadge = document.getElementById('hardwareCountBadge');

    if (cuttingBadge) cuttingBadge.textContent = '0 peças';
    if (hardwareBadge) hardwareBadge.textContent = '0 itens';
  }
}

export default CutListUI;
