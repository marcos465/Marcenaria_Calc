/**
 * Motor de Cálculo de Ferragens e Insumos para Marcenaria
 * @file js/modules/engine/hardwareList.js
 */

export class HardwareListEngine {
  /**
   * Sanitiza entradas numéricas para evitar NaN, null ou números negativos.
   * @param {*} value - Valor de entrada
   * @param {number} fallback - Valor padrão em caso de erro
   * @returns {number}
   */
  static #sanitize(value, fallback = 0) {
    const parsed = Number(value);
    return isNaN(parsed) || parsed < 0 ? fallback : parsed;
  }

  /**
   * Constrói e padroniza a estrutura de um HardwareItem.
   * @param {Object} item 
   * @returns {Object} HardwareItem
   */
  static #createHardwareItem({
    id = '',
    name = 'Item Sem Nome',
    quantity = 0,
    unit = 'un',
    description = ''
  } = {}) {
    return {
      id: String(id),
      name: String(name),
      quantity: Math.max(0, Number(this.#sanitize(quantity).toFixed(2))),
      unit: String(unit),
      description: String(description)
    };
  }

  /**
   * Calcula o comprimento comercial padrão para corrediças de acordo com a profundidade do móvel.
   * @param {number} depth Profundidade em mm
   * @returns {number} Tamanho nominal da corrediça em mm
   */
  static #getSlideSize(depth) {
    if (depth >= 550) return 500;
    if (depth >= 500) return 450;
    if (depth >= 450) return 400;
    if (depth >= 400) return 350;
    if (depth >= 350) return 300;
    return 250;
  }

  /**
   * Calcula a lista de ferragens e insumos necessários a partir do estado do móvel.
   * @param {Object} furnitureState - Instância de estado ou objeto contendo os parâmetros do móvel.
   * @returns {Array<Object>} Lista de objetos do tipo HardwareItem.
   */
  static calculate(furnitureState = {}) {
    const width = this.#sanitize(furnitureState.width);
    const height = this.#sanitize(furnitureState.height);
    const depth = this.#sanitize(furnitureState.depth);
    const doorsQty = Math.floor(this.#sanitize(furnitureState.doorsQuantity));
    const shelvesQty = Math.floor(this.#sanitize(furnitureState.shelvesQuantity));
    const drawersQty = Math.floor(this.#sanitize(furnitureState.drawersQuantity));

    const hardwareList = [];

    // 1. Dobradiças e Calços
    if (doorsQty > 0) {
      // Regra de altura para dobradiças: portas acima de 900mm exigem 3 dobradiças
      const doorHeight = Math.max(0, height - 3);
      const hingesPerDoor = doorHeight > 900 ? 3 : 2;
      const totalHinges = doorsQty * hingesPerDoor;

      hardwareList.push(
        this.#createHardwareItem({
          id: 'dobradica-caneco-35mm',
          name: 'Dobradiça Caneco 35mm Reta',
          quantity: totalHinges,
          unit: 'un',
          description: `${hingesPerDoor} dobradiças por porta (altura da porta: ${doorHeight}mm)`
        })
      );

      hardwareList.push(
        this.#createHardwareItem({
          id: 'calco-dobradica',
          name: 'Calço para Dobradiça 35mm',
          quantity: totalHinges,
          unit: 'un',
          description: 'Acompanha a fixação das dobradiças na lateral interna'
        })
      );
    }

    // 2. Puxadores
    const totalPulls = doorsQty + drawersQty;
    if (totalPulls > 0) {
      hardwareList.push(
        this.#createHardwareItem({
          id: 'puxador-padrao',
          name: 'Puxador (Modelo Padrão)',
          quantity: totalPulls,
          unit: 'un',
          description: `Total para ${doorsQty} porta(s) e ${drawersQty} gaveta(s)`
        })
      );
    }

    // 3. Suportes de Prateleira
    if (shelvesQty > 0) {
      hardwareList.push(
        this.#createHardwareItem({
          id: 'suporte-prateleira-pino',
          name: 'Suporte para Prateleira tipo Pino (5mm)',
          quantity: shelvesQty * 4,
          unit: 'un',
          description: '4 suportes por prateleira interna'
        })
      );
    }

    // 4. Corrediças Telescópicas
    if (drawersQty > 0) {
      const slideSize = this.#getSlideSize(depth);
      hardwareList.push(
        this.#createHardwareItem({
          id: `corredica-telescopica-${slideSize}mm`,
          name: `Corrediça Telescópica ${slideSize}mm`,
          quantity: drawersQty,
          unit: 'par',
          description: `1 par por gaveta (comprimento nominal: ${slideSize}mm)`
        })
      );
    }

    // 5. Parafusos de Montagem (Estrutura + Gavetas + Fundo)
    // Estimativa: 8 fixações para estrutura principal, 8 para cada gaveta, mais montagens de fundo e ferragens
    const structuralScrews = 8 + (drawersQty * 8) + (shelvesQty * 4);
    const hardwareScrews = (doorsQty * 4) + (drawersQty * 12) + (shelvesQty * 4);

    hardwareList.push(
      this.#createHardwareItem({
        id: 'parafuso-soberbo-70x50',
        name: 'Parafuso Structura 7.0x50mm (Soberbo / Confirmat)',
        quantity: structuralScrews,
        unit: 'un',
        description: 'União e estruturação das chapas MDF da caixa e gavetas'
      })
    );

    hardwareList.push(
      this.#createHardwareItem({
        id: 'parafuso-chipboard-40x16',
        name: 'Parafuso Chipboard 4.0x16mm Flangeado/Chato',
        quantity: hardwareScrews,
        unit: 'un',
        description: 'Fixação de dobradiças, corrediças, suportes e fundo'
      })
    );

    // 6. Tapa-furos
    // Estimativa de cartelas (1 cartela contém ~50 adesivos tapa-furo)
    const totalExposedHoles = structuralScrews;
    const coverCapsCards = Math.ceil(totalExposedHoles / 50) || 1;

    hardwareList.push(
      this.#createHardwareItem({
        id: 'tapa-furo-adesivo',
        name: 'Tapa-furo Adesivo (Cor do MDF)',
        quantity: coverCapsCards,
        unit: 'cx',
        description: `Cobrir ${totalExposedHoles} furos aparentes de parafusos de estrutura`
      })
    );

    return hardwareList;
  }
}
