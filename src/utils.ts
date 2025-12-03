// src/utils.ts

// TIPOS DE VENDA (para VendasScreen)
export type TipoVenda = 'LASER' | '3D' | 'OUTRO';

export const tipoIcones: Record<TipoVenda, string> = {
  LASER: 'laser-pointer',      // impressão/gravação a laser
  '3D': 'printer-3d',          // impressão 3D
  OUTRO: 'cube-outline',       // qualquer outro tipo
};

// STATUS DAS VENDAS (para StatusVendas, Relatórios, etc.)
export type StatusVenda = 'FEITA' | 'PRONTA' | 'PAGA' | 'ENTREGUE';

export const statusLabels: Record<StatusVenda, string> = {
  FEITA: 'Venda feita',
  PRONTA: 'Pronta',
  PAGA: 'Paga',
  ENTREGUE: 'Entregue',
};

// CONFIGURAÇÃO DA LOJA (para LoginScreen, Relatórios, Orçamentos, etc.)
export type LojaConfig = {
  id?: number;
  nome: string;
  contato: string;
  observacoes: string;
  logoUri?: string | null;
};

// FORMATAÇÃO DE DATA ISO -> PT-BR (DD/MM/AAAA)
export function formatDateToBR(value: string | Date): string {
  let d: Date;

  if (value instanceof Date) {
    d = value;
  } else {
    // garante que a string seja tratada como data local
    d = new Date(value + 'T00:00:00');
  }

  if (isNaN(d.getTime())) {
    // se der ruim, devolve o valor original
    return typeof value === 'string' ? value : '';
  }

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();

  return `${dia}/${mes}/${ano}`;
}
