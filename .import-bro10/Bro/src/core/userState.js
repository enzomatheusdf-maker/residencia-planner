import { diffDays, todayStr } from "./fsrs";

/**
 * Computa o estado comportamental do usuário com base no histórico de revisões/estudos.
 * Estados:
 *  - "new": Conta criada há menos de 7 dias com menos de 3 sessões finalizadas.
 *  - "dormant": Inativo (sem nenhuma sessão realizada) nos últimos 14 dias.
 *  - "at_risk": Inativo (sem nenhuma sessão realizada) entre 7 e 13 dias.
 *  - "resurrected": Retornou de um período inativo (>= 7 dias) e realizou estudo nas últimas 48h.
 *  - "current": Usuário ativo regular (realizou estudo nos últimos 7 dias).
 * 
 * @param {string} dataCriacao - Data de criação da conta (AAAA-MM-DD).
 * @param {Array<string>} datasSessoes - Array de datas das sessões realizadas (AAAA-MM-DD).
 * @param {string} [hoje] - Data de referência de hoje.
 */
export function getUserState(dataCriacao, datasSessoes = [], hoje = todayStr()) {
  const dCriacao = dataCriacao || hoje;
  const diasDesdeCriacao = diffDays(dCriacao, hoje);

  // Filtrar e ordenar datas válidas
  const sessoesOrdenadas = [...new Set(datasSessoes)]
    .filter(d => !!d)
    .sort((a, b) => a.localeCompare(b));

  const totalSessoes = sessoesOrdenadas.length;

  if (totalSessoes === 0) {
    if (diasDesdeCriacao >= 14) return "dormant";
    if (diasDesdeCriacao >= 7) return "at_risk";
    return "new";
  }

  const ultimaSessao = sessoesOrdenadas[totalSessoes - 1];
  const diasInativo = diffDays(ultimaSessao, hoje);

  // Verificar se o usuário ressuscitou (inativo >= 7 dias e voltou nas últimas 48h)
  if (diasInativo <= 2 && totalSessoes >= 1) {
    let isResurrected = false;
    if (totalSessoes === 1) {
      if (diffDays(dCriacao, sessoesOrdenadas[0]) >= 7) {
        isResurrected = true;
      }
    } else {
      const penultima = sessoesOrdenadas[totalSessoes - 2];
      const ultima = sessoesOrdenadas[totalSessoes - 1];
      if (diffDays(penultima, ultima) >= 7) {
        isResurrected = true;
      }
    }
    if (isResurrected) return "resurrected";
  }

  // Verificar inatividade atual
  if (diasInativo >= 14) return "dormant";
  if (diasInativo >= 7) return "at_risk";

  // Verificar se ainda é novo
  if (diasDesdeCriacao < 7 && totalSessoes < 3) {
    return "new";
  }

  return "current";
}
