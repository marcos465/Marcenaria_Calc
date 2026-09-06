/**
 * js/modules/display/triagemFormUI.js
 * Módulo de Interface para o Formulário de Triagem do MarcenariaCalc.
 * 
 * Responsável por capturar entradas do usuário, higienizar valores, sincronizar
 * em tempo real com a instância do FurnitureState e notificar alterações na UI.
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
 * Classe responsável pelo gerenciamento da UI e dos eventos do formulário de triagem.
 */
export class TriagemFormUI {
  /**
   * Instancia o gerenciador de formulário.
   * @param {string} containerId - ID do elemento contêiner no DOM (padrão: 'formContainer').
   */
  constructor(containerId = 'formContainer') {
    this.containerId = containerId;
    this.container = null;
    this.furnitureState = null;
    this.onStateChangeCallback = null;

    // Bind dos manipuladores de eventos para manter o contexto correto
    this._handleInput = this._handleInput.bind(this);
    this._handleChange = this._handleChange.bind(this);
  }

  /**
   * Inicializa o componente renderizando a estrutura, aplicando o estado inicial e vinculando eventos.
   * @param {Object} furnitureStateInstance - Instância única do gerenciador de estado (FurnitureState).
   * @param {Function} [onStateChangeCallback] - Callback opcional engatilhado após atualizações do estado.
   */
  init(furnitureStateInstance, onStateChangeCallback = null) {
    if (!furnitureStateInstance) {
      throw new Error('[TriagemFormUI] É necessário fornecer uma instância válida de FurnitureState.');
    }

    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`[TriagemFormUI] Elemento #${this.containerId} não foi encontrado no DOM.`);
      return;
    }

    this.furnitureState = furnitureStateInstance;
    this.onStateChangeCallback = onStateChangeCallback;

    // Renderiza o HTML do formulário no contêiner indicado
    this.render();

    // Sincroniza os inputs com o estado atual da instância
    this.syncFormFromState();

    // Vincula ouvidores de eventos delegados para melhor performance
    this._bindEvents();
  }

  /**
   * Gera o HTML estático do formulário de triagem com marcação semântica e acessível.
   */
  render() {
    const html = `
      <form id="triagemForm" class="triagem-form" aria-label="Formulário de Triagem de Móvel">
        <header class="form-header">
          <h2 class="form-title">Dimensões & Estrutura</h2>
          <p class="form-subtitle">Informe as medidas brutas e especificações do projeto.</p>
        </header>

        <div class="form-grid">
          <!-- Identificação do Projeto -->
          <div class="form-group form-group--full">
            <label for="projectName" class="form-label">Nome do Projeto / Cliente</label>
            <input 
              type="text" 
              id="projectName" 
              name="projectName" 
              class="form-input" 
              placeholder="Ex: Armário de Cozinha - Módulo A" 
              autocomplete="off"
            />
          </div>

          <!-- Dimensões Principais -->
          <div class="form-group">
            <label for="height" class="form-label">Altura (mm)</label>
            <input 
              type="number" 
              id="height" 
              name="height" 
              class="form-input" 
              placeholder="Ex: 720" 
              min="1" 
              step="1"
              required 
            />
          </div>

          <div class="form-group">
            <label for="width" class="form-label">Largura (mm)</label>
            <input 
              type="number" 
              id="width" 
              name="width" 
              class="form-input" 
              placeholder="Ex: 800" 
              min="1" 
              step="1"
              required 
            />
          </div>

          <div class="form-group">
            <label for="depth" class="form-label">Profundidade (mm)</label>
            <input 
              type="number" 
              id="depth" 
              name="depth" 
              class="form-input" 
              placeholder="Ex: 500" 
              min="1" 
              step="1"
              required 
            />
          </div>

          <!-- Seleção de Materiais -->
          <div class="form-group">
            <label for="thickness" class="form-label">Espessura da Chapa (mm)</label>
            <select id="thickness" name="thickness" class="form-select">
              <option value="15">15 mm</option>
              <option value="18">18 mm</option>
              <option value="25">25 mm</option>
              <option value="6">6 mm (Fundo/Gaveta)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="materialType" class="form-label">Tipo de Material</label>
            <select id="materialType" name="materialType" class="form-select">
              <option value="MDF_BRANCO">MDF Branco TX</option>
              <option value="MDF_AMADEIRADO">MDF Amadeirado / Colorido</option>
              <option value="MDP_BRANCO">MDP Branco</option>
              <option value="COMPENSADO">Compensado Naval</option>
            </select>
          </div>

          <!-- Configurações Adicionais -->
          <div class="form-group">
            <label for="backPlateType" class="form-label">Tipo de Fundo</label>
            <select id="backPlateType" name="backPlateType" class="form-select">
              <option value="RAIADO">Rasgado / Encaixado (6mm)</option>
              <option value="SOBREPOSTO">Sobreposto / Pregado (6mm)</option>
              <option value="MESMA_ESPESSURA">Mesma Espessura do Corpo</option>
              <option value="SEM_FUNDO">Sem Fundo</option>
            </select>
          </div>

          <div class="form-group form-group--full">
            <label class="form-checkbox-label">
              <input type="checkbox" id="hasEdgeBanding" name="hasEdgeBanding" class="form-checkbox" />
              <span>Aplicar Fita de Borda em todas as faces visíveis</span>
            </label>
          </div>
        </div>
      </form>
    `;

    this.container.innerHTML = html;
  }

  /**
   * Preenche os campos do formulário com os dados contidos na instância de FurnitureState.
   */
  syncFormFromState() {
    if (!this.furnitureState) return;

    // Suporta estados expostos via métodos getters ou atributos diretos
    const stateData = typeof this.furnitureState.getState === 'function' 
      ? this.furnitureState.getState() 
      : this.furnitureState;

    const form = this.container.querySelector('#triagemForm');
    if (!form) return;

    const fields = ['projectName', 'height', 'width', 'depth', 'thickness', 'materialType', 'backPlateType'];

    fields.forEach((field) => {
      const input = form.elements[field];
      if (input && stateData[field] !== undefined && stateData[field] !== null) {
        input.value = escapeHTML(stateData[field]);
      }
    });

    if (form.elements['hasEdgeBanding'] && stateData.hasEdgeBanding !== undefined) {
      form.elements['hasEdgeBanding'].checked = Boolean(stateData.hasEdgeBanding);
    }
  }

  /**
   * Vincula delegadores de eventos no contêiner para otimização de performance.
   * @private
   */
  _bindEvents() {
    if (!this.container) return;

    // Escuta entradas contínuas (textos, números)
    this.container.addEventListener('input', this._handleInput);

    // Escuta alterações definitivas (selects, checkboxes)
    this.container.addEventListener('change', this._handleChange);
  }

  /**
   * Gerencia eventos do tipo 'input' em tempo real.
   * @private
   * @param {Event} event 
   */
  _handleInput(event) {
    const { name, type } = event.target;
    if (!name || type === 'checkbox' || type === 'select-one') return;

    this._updateStateFromElement(event.target);
  }

  /**
   * Gerencia eventos do tipo 'change'.
   * @private
   * @param {Event} event 
   */
  _handleChange(event) {
    const { name } = event.target;
    if (!name) return;

    this._updateStateFromElement(event.target);
  }

  /**
   * Extrai e sanitiza o valor do elemento e o envia ao FurnitureState.
   * @private
   * @param {HTMLElement} element - O elemento do formulário alterado.
   */
  _updateStateFromElement(element) {
    const { name, type, value, checked } = element;

    let parsedValue;

    if (type === 'checkbox') {
      parsedValue = Boolean(checked);
    } else if (type === 'number') {
      parsedValue = value === '' ? 0 : Number(value);
    } else {
      parsedValue = escapeHTML(value.trim());
    }

    // Tenta atualizar no FurnitureState usando padrão setter/método dinâmico ou propriedade direta
    const updateMethodName = `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    
    if (typeof this.furnitureState[updateMethodName] === 'function') {
      this.furnitureState[updateMethodName](parsedValue);
    } else if (typeof this.furnitureState.update === 'function') {
      this.furnitureState.update({ [name]: parsedValue });
    } else {
      this.furnitureState[name] = parsedValue;
    }

    // Executa a callback informando a atualização de estado
    if (typeof this.onStateChangeCallback === 'function') {
      this.onStateChangeCallback(name, parsedValue, this.furnitureState);
    }
  }

  /**
   * Remove ouvidores de evento do DOM para evitar vazamentos de memória ao fechar ou re-renderizar.
   */
  destroy() {
    if (this.container) {
      this.container.removeEventListener('input', this._handleInput);
      this.container.removeEventListener('change', this._handleChange);
      this.container.innerHTML = '';
    }
    this.container = null;
    this.furnitureState = null;
    this.onStateChangeCallback = null;
  }
}

export default TriagemFormUI;
