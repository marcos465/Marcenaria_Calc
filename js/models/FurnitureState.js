/**
 * Modelo de Dados do Estado do Móvel (FurnitureState)
 * @file js/models/FurnitureState.js
 */

export class FurnitureState {
  /**
   * Instancia e sanitiza o estado inicial de um móvel.
   * @param {Object} options - Parâmetros de configuração do móvel.
   */
  constructor({
    width = 0,
    height = 0,
    depth = 0,
    mdfThickness = 15,
    backPanelThickness = 3,
    doorsQuantity = 2,
    shelvesQuantity = 1,
    drawersQuantity = 0,
    rawInputs = {}
  } = {}) {
    // Sanitização e Atribuição de Propriedades
    this.width = this.#sanitizeNumber(width);
    this.height = this.#sanitizeNumber(height);
    this.depth = this.#sanitizeNumber(depth);
    this.mdfThickness = this.#sanitizeNumber(mdfThickness);
    this.backPanelThickness = this.#sanitizeNumber(backPanelThickness);
    this.doorsQuantity = Math.floor(this.#sanitizeNumber(doorsQuantity));
    this.shelvesQuantity = Math.floor(this.#sanitizeNumber(shelvesQuantity));
    this.drawersQuantity = Math.floor(this.#sanitizeNumber(drawersQuantity));
    
    // Armazenamento de auditoria (cópia superficial para evitar mutação externa)
    this.rawInputs = { ...rawInputs };
  }

  /**
   * Método privado para sanitização defensiva de números.
   * @param {*} value - Valor a ser convertido/higienizado.
   * @returns {number} Número positivo válido ou 0.
   */
  #sanitizeNumber(value) {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const parsed = Number(value);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }

  /**
   * Valida as regras de negócio e dimensões mínimas viáveis.
   * @returns {{ isValid: boolean, message: string }} Resultado da validação.
   */
  validate() {
    const MIN_DIMENSION = 100; // 100mm
    const VALID_MDF_THICKNESSES = [15, 18]; // Padrões comuns de mercado em mm

    if (this.width < MIN_DIMENSION) {
      return {
        isValid: false,
        message: `A largura mínima permitida é de ${MIN_DIMENSION}mm.`
      };
    }

    if (this.height < MIN_DIMENSION) {
      return {
        isValid: false,
        message: `A altura mínima permitida é de ${MIN_DIMENSION}mm.`
      };
    }

    if (this.depth < MIN_DIMENSION) {
      return {
        isValid: false,
        message: `A profundidade mínima permitida é de ${MIN_DIMENSION}mm.`
      };
    }

    if (!VALID_MDF_THICKNESSES.includes(this.mdfThickness)) {
      return {
        isValid: false,
        message: `Espessura do MDF inválida (${this.mdfThickness}mm). Espessuras aceitas: ${VALID_MDF_THICKNESSES.join('mm ou ')}mm.`
      };
    }

    return {
      isValid: true,
      message: 'Estado do móvel válido.'
    };
  }

  /**
   * Retorna uma representação plana e higienizada do estado.
   * @returns {Object} Objeto com dados do estado e auditoria.
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      depth: this.depth,
      mdfThickness: this.mdfThickness,
      backPanelThickness: this.backPanelThickness,
      doorsQuantity: this.doorsQuantity,
      shelvesQuantity: this.shelvesQuantity,
      drawersQuantity: this.drawersQuantity,
      rawInputs: { ...this.rawInputs }
    };
  }
}
