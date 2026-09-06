/**
 * Motor de Cálculo de Lista de Corte para Marcenaria
 * @file js/modules/engine/cuttingList.js
 */

export class CuttingListEngine {
  /**
   * Sanitiza e valida números para evitar resultados NaN ou negativos.
   * @param {*} value - Valor de entrada
   * @param {number} fallback - Valor padrão
   * @returns {number}
   */
  static #sanitize(value, fallback = 0) {
    const parsed = Number(value);
    return isNaN(parsed) || parsed < 0 ? fallback : parsed;
  }

  /**
   * Fabrica e padroniza a estrutura de um CuttingItem.
   * @param {Object} item 
   * @returns {Object} CuttingItem
   */
  static #createCuttingItem({
    id = '',
    name = 'Peça',
    quantity = 1,
    length = 0,
    width = 0,
    thickness = 15,
    description = ''
  } = {}) {
    return {
      id: String(id),
      name: String(name),
      quantity: Math.max(1, Math.floor(this.#sanitize(quantity, 1))),
      length: Math.max(0, Number(this.#sanitize(length).toFixed(1))),
      width: Math.max(0, Number(this.#sanitize(width).toFixed(1))),
      thickness: Math.max(0, Number(this.#sanitize(thickness).toFixed(1))),
      description: String(description)
    };
  }

  /**
   * Calcula a lista de corte completa a partir do estado do móvel.
   * @param {Object} furnitureState - Instância ou objeto com as propriedades do móvel.
   * @returns {Array<Object>} Lista de objetos do tipo CuttingItem.
   */
  static calculate(furnitureState = {}) {
    const width = this.#sanitize(furnitureState.width);
    const height = this.#sanitize(furnitureState.height);
    const depth = this.#sanitize(furnitureState.depth);
    const mdfThickness = this.#sanitize(furnitureState.mdfThickness, 15);
    const backThickness = this.#sanitize(furnitureState.backPanelThickness, 3);
    const doorsQty = Math.floor(this.#sanitize(furnitureState.doorsQuantity));
    const shelvesQty = Math.floor(this.#sanitize(furnitureState.shelvesQuantity));
    const drawersQty = Math.floor(this.#sanitize(furnitureState.drawersQuantity));

    const cuttingList = [];

    // 1. Laterais (2x)
    cuttingList.push(
      this.#createCuttingItem({
        id: 'lateral-caixa',
        name: 'Lateral (Esq/Dir)',
        quantity: 2,
        length: height,
        width: depth,
        thickness: mdfThickness,
        description: 'Fitar frontal'
      })
    );

    // 2. Base e Teto (2x)
    const innerWidth = Math.max(0, width - (2 * mdfThickness));
    cuttingList.push(
      this.#createCuttingItem({
        id: 'base-teto-caixa',
        name: 'Base / Teto',
        quantity: 2,
        length: innerWidth,
        width: depth,
        thickness: mdfThickness,
        description: 'Fitar frontal'
      })
    );

    // 3. Prateleiras Internas (shelvesQuantity x)
    if (shelvesQty > 0) {
      const shelfLength = Math.max(0, innerWidth - 2); // 2mm folga de encaixe
      const shelfWidth = Math.max(0, depth - 20);      // 20mm recuo da porta

      cuttingList.push(
        this.#createCuttingItem({
          id: 'prateleira-interna',
          name: 'Prateleira Interna',
          quantity: shelvesQty,
          length: shelfLength,
          width: shelfWidth,
          thickness: mdfThickness,
          description: 'Recuo de 20mm na profundidade - Fitar frontal'
        })
      );
    }

    // 4. Fundo do Móvel (1x)
    if (width > 0 && height > 0) {
      const backLength = Math.max(0, height - 10);
      const backWidth = Math.max(0, width - 10);

      cuttingList.push(
        this.#createCuttingItem({
          id: 'fundo-movel',
          name: 'Fundo do Móvel',
          quantity: 1,
          length: backLength,
          width: backWidth,
          thickness: backThickness,
          description: 'Desconto de 10mm na altura e largura para rebaixo/prego'
        })
      );
    }

    // 5. Portas (doorsQuantity x)
    if (doorsQty > 0) {
      const gapTotalWidth = 3; // Folga total para divisão entre portas e laterais
      const doorHeight = Math.max(0, height - 3); // 3mm folga na altura
      const doorWidth = Math.max(0, (width - gapTotalWidth) / doorsQty);

      cuttingList.push(
        this.#createCuttingItem({
          id: 'porta-externa',
          name: 'Porta',
          quantity: doorsQty,
          length: doorHeight,
          width: doorWidth,
          thickness: mdfThickness,
          description: 'Fitar os 4 lados - Considerado 3mm de folga'
        })
      );
    }

    // 6. Estrutura de Gavetas (Caixa da gaveta - 4x painéis por gaveta)
    if (drawersQty > 0) {
      const drawerDepth = Math.max(0, depth - 50); // Folga para corrediça traseira
      const drawerHeight = 120; // Altura padrão de lateral de gaveta em mm
      
      // Laterais da Gaveta (2x por gaveta)
      cuttingList.push(
        this.#createCuttingItem({
          id: 'gaveta-lateral',
          name: 'Lateral de Gaveta',
          quantity: drawersQty * 2,
          length: drawerDepth,
          width: drawerHeight,
          thickness: mdfThickness,
          description: 'Estrutura interna da gaveta'
        })
      );

      // Frente/Fundo interno da Gaveta (2x por gaveta)
      // Desconto: largura interna do móvel - 2x espessuras da lateral da gaveta - 26mm (folga par de corrediça telescópica)
      const drawerInnerWidth = Math.max(0, innerWidth - (2 * mdfThickness) - 26);
      
      cuttingList.push(
        this.#createCuttingItem({
          id: 'gaveta-cabeceira',
          name: 'Cabeceira/Traseiro Gaveta',
          quantity: drawersQty * 2,
          length: drawerInnerWidth,
          width: drawerHeight,
          thickness: mdfThickness,
          description: 'Desconto de 26mm para corrediças telescópicas'
        })
      );
    }

    return cuttingList;
  }
}
