// src/styles.ts
import { StyleSheet, Platform } from 'react-native';

export const COLORS = {
  background: '#020617', // fundo geral
  card: '#030712',
  cardSoft: '#020617',
  border: '#1f2937',
  borderSoft: '#111827',
  primary: '#3b82f6',
  primarySoft: '#2563eb',
  primaryText: '#ffffff',
  secondary: '#111827',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  danger: '#f97373',
  success: '#22c55e',
  warning: '#facc15',
  tabBar: '#020617',
  tabBarBorder: '#0f172a',
};

const SHADOW_CARD =
  Platform.OS === 'android'
    ? { elevation: 3 }
    : {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      };

const styles = StyleSheet.create({
  // -------------------------------------------
  // BASE
  // -------------------------------------------
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 20
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

 // HEADER / LOGO
headerTop: {
  alignItems: 'center',
  marginBottom: 8,
  paddingTop: Platform.OS === 'android' ? 16 : 24,
},
headerLogoWrapper: {
  width: 160,
  height: 160,
  borderRadius: 24,
  backgroundColor: '#020617',
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: COLORS.borderSoft,
  ...SHADOW_CARD,
},
headerLogo: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},
headerLogoLarge: {   // alias pra não quebrar nada antigo
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},
headerLogoPlaceholder: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
headerLogoPlaceholderText: {
  color: COLORS.textMuted,
  fontSize: 16,
  fontWeight: '600',
},
headerTitle: {
  marginTop: 16,
  fontSize: 26,
  fontWeight: '800',
  color: COLORS.text,
  textAlign: 'center',
},
headerSubtitle: {
  marginTop: 2,
  fontSize: 13,
  color: COLORS.textMuted,
  textAlign: 'center',
},
headerScreenTitle: { // alias antigo, se alguma tela ainda usar
  marginTop: 16,
  fontSize: 26,
  fontWeight: '800',
  color: COLORS.text,
  textAlign: 'center',
},

  // -------------------------------------------
  // CARDS / TEXTOS / INPUTS
  // -------------------------------------------
  card: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    ...SHADOW_CARD,
  },
  cardHeaderLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitulo: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },

  // textos em cards (NOVOS)
  cardText: {
    fontSize: 14,
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 10 : 12,
    color: COLORS.text,
    fontSize: 14,
  },

  // campo de data
  inputDate: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 10 : 12,
  },
  inputDateText: {
    color: COLORS.text,
    fontSize: 14,
  },

  // lista vazia / texto vazio (NOVO alias)
  listaVaziaTexto: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
    // -------------------------------------------
  // METAS – COMPATIBILIDADE COM VERSÃO ANTIGA
  // -------------------------------------------

  // container geral que você usava como "cardRes"
  cardRes: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW_CARD,
  },

  // linha onde fica a barra de progresso (se tiver)
  barraProgressoLinha: {
    marginTop: 8,
    marginBottom: 4,
  },

  // se em algum lugar você usava "barraProgresso",
  // deixamos como alias pra barra de progresso nova
  barraProgresso: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#020617',
    overflow: 'hidden',
  },

  // texto pequeno embaixo da barra (porcentagem/meta)
  barraProgressoTexto: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textMuted,
  },
    // -------------------------------------------
  // METAS – BARRA DE PROGRESSO (compat com código antigo)
  // -------------------------------------------
  barraContainer: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#020617',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  barraPreenchida: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  barraLegenda: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },



  // -------------------------------------------
  // TIPO (LASER / 3D / OUTRO / CATEGORIAS COMPRAS)
  // -------------------------------------------
  tipoLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tipoBotao: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
    backgroundColor: COLORS.cardSoft,
  },
  tipoBotaoAtivo: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primarySoft,
  },
  tipoBotaoTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tipoBotaoTextoAtivo: {
    color: COLORS.primaryText,
  },
  // usados no ComprasScreen
  tipoTexto: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  tipoTextoAtivo: {
    fontSize: 12,
    color: COLORS.primaryText,
    fontWeight: '600',
    textAlign: 'center',
  },

  // -------------------------------------------
  // ITENS DA VENDA (vários produtos)
  // -------------------------------------------
  itemVendaCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemVendaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemVendaTitulo: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemVendaRemover: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(248,113,113,0.08)',
  },

  // -------------------------------------------
  // BOTÕES
  // -------------------------------------------
  botaoIcon: {
    marginRight: 8,
  },
  botaoPrimario: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...SHADOW_CARD,
  },
  botaoPrimarioTexto: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  botaoSecundario: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  botaoSecundarioTexto: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // texto de botão secundário (NOVO alias usado em alguns lugares)
  buttonSecondaryText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // usados no ComprasScreen (Salvar compra)
  botao: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...SHADOW_CARD,
  },
  botaoTexto: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },

  // -------------------------------------------
  // RESUMO VENDA / COMPRAS
  // -------------------------------------------
  resumoLinha: {
    marginTop: 4,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  resumoValor: {
    color: COLORS.text,
    fontWeight: '700',
  },
  resumoTitulo: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  resumoBadgePositivo: {
    color: '#bbf7d0',
  },
  resumoBadgeNegativo: {
    color: '#fecaca',
  },

  // -------------------------------------------
  // MODAL (geral)
  // -------------------------------------------
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 22,
    padding: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    ...SHADOW_CARD,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  modalStatusHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    minWidth: 110,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalButtonCancel: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    marginRight: 8,
  },
  modalButtonConfirm: {
    borderColor: COLORS.primarySoft,
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryText,
  },
  modalButtonTextCancel: {
    color: COLORS.text,
  },

  // aliases antigos / compat
  modalTexto: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  modalBotoesLinha: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalBotao: {
    minWidth: 110,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 8,
  },
  modalBotaoCancelar: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
  },
  modalBotaoConfirmar: {
    borderColor: COLORS.primarySoft,
    backgroundColor: COLORS.primary,
  },

  // -------------------------------------------
  // TAB BAR
  // -------------------------------------------
  tabBar: {
    backgroundColor: COLORS.tabBar,
    borderTopWidth: 1,
    borderTopColor: COLORS.tabBarBorder,
    paddingBottom: Platform.OS === 'android' ? 6 : 12,
    paddingTop: 4,
    height: Platform.OS === 'android' ? 64 : 80,
  },
  tabBarIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarLabel: {
    fontSize: 11,
    marginTop: 2,
    color: COLORS.textMuted,
  },
  tabBarLabelFocused: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // -------------------------------------------
  // FILTROS / CHIPS (Status, Relatórios, Compras)
  // -------------------------------------------
  filtroLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  filtroBotao: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
    backgroundColor: COLORS.cardSoft,
  },
  filtroBotaoAtivo: {
    borderColor: COLORS.primarySoft,
    backgroundColor: 'rgba(59,130,246,0.16)',
  },
  filtroBotaoTexto: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  filtroBotaoTextoAtivo: {
    color: COLORS.primaryText,
    fontWeight: '600',
  },
  filtroCampo: {
    flex: 1,
    marginRight: 8,
    marginTop: 4,
  },
  filtroDataBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSoft,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'android' ? 8 : 10,
  },
  filtroDataTexto: {
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 4,
  },

  // filtros específicos do StatusVendas
  statusFiltroChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginTop: 6,
    backgroundColor: COLORS.cardSoft,
  },
  statusFiltroChipAtivo: {
    borderColor: COLORS.primarySoft,
    backgroundColor: 'rgba(59,130,246,0.16)',
  },
  statusFiltroTexto: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusFiltroTextoAtivo: {
    fontSize: 12,
    color: COLORS.primaryText,
    fontWeight: '600',
  },

  // -------------------------------------------
  // STATUS VENDAS – LISTAGEM
  // -------------------------------------------
  vendaItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  vendaLinhaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendaCliente: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  vendaDescricao: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  vendaDataValor: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  vendaStatusFinalTexto: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  statusActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    marginRight: 8,
    marginTop: 4,
    backgroundColor: 'rgba(59,130,246,0.10)',
  },
  statusActionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryText,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusBadgeFeita: {
    borderColor: COLORS.warning,
    backgroundColor: 'rgba(250,204,21,0.06)',
  },
  statusBadgePronta: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(59,130,246,0.10)',
  },
  statusBadgePaga: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  statusBadgeEntregue: {
    borderColor: COLORS.textMuted,
    backgroundColor: 'rgba(148,163,184,0.10)',
  },
  statusBadgeTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },

  // -------------------------------------------
  // RELATÓRIOS
  // -------------------------------------------
  resumoCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resumoValorGrande: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  resumoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  resumoLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  resumoValorLinha: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  // -------------------------------------------
  // METAS
  // -------------------------------------------
  metaCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  metaDescricao: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  metaProgressoBarraFundo: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#020617',
    overflow: 'hidden',
  },
  metaProgressoBarraPreenchida: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  metaProgressoTexto: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // -------------------------------------------
  // COMPRAS (ComprasScreen)
  // -------------------------------------------
  comprasSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  comprasResumoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  comprasResumoValor: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  compraItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  compraLinhaSuperior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compraFornecedor: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  compraDescricao: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  compraDataValor: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  orcItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orcItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  orcItemSubText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // linha de input com ícone à esquerda
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputIconLeft: {
    marginRight: 8,
  },


// --- CLIENTES ---

clienteActionsRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 10,
  marginTop: 12,
},

modalInput: {
  backgroundColor: COLORS.cardSoft,
  borderRadius: 14,
  paddingHorizontal: 14,
  paddingVertical: 10,
  color: COLORS.text,
  borderWidth: 1,
  borderColor: COLORS.border,
  fontSize: 14,
},

clienteRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderRadius: 16,
  backgroundColor: COLORS.card,
  borderWidth: 1,
  borderColor: COLORS.borderSoft,
  marginBottom: 10,
},

clienteInfo: {
  flex: 1,
  marginLeft: 10,
},

clienteNome: {
  color: COLORS.text,
  fontSize: 14,
  fontWeight: '600',
},

clienteTelefone: {
  color: COLORS.textMuted,
  fontSize: 12,
  marginTop: 2,
},

clienteObservacoes: {
  color: COLORS.textMuted,
  fontSize: 12,
  marginTop: 2,
},

clienteIconWrapper: {
  width: 40,
  height: 40,
  borderRadius: 999,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: COLORS.cardSoft,
  borderWidth: 1,
  borderColor: COLORS.border,
},

});

export default styles;
