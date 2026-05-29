// ID da sua planilha
const SPREADSHEET_ID = '1qe-CeAzTq17GidQciXyIROsnBy6DrpwBTe6uNCoc9f0';

function doGet(e) {
  Logger.log('[doGet] Iniciando execução do aplicativo web.');
  try {
    const template = HtmlService.createTemplateFromFile('index');
    const output = template.evaluate()
        .setTitle('Portal Caianinho')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    Logger.log('[doGet] Template HTML avaliado e retornado com sucesso.');
    return output;
  } catch (err) {
    Logger.log('[doGet] Erro ao renderizar template: ' + err.toString());
    return HtmlService.createHtmlOutput('Erro interno no servidor.');
  }
}

function getSheet(name) {
  Logger.log('[getSheet] Solicitando aba: ' + name);
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(name);
    
    if (!sheet) {
      Logger.log('[getSheet] Aba "' + name + '" não encontrada. Criando nova aba...');
      sheet = ss.insertSheet(name);
      
      let header = [];
      if (name === 'Membros') {
        header = ['Nome', 'Nascimento', 'Telefone', 'Genero', 'Escala', 'Grau', 'Username', 'Senha', 'Cargo'];
      } else if (name === 'Lanches') {
        header = ['Item', 'Pessoa'];
      } else if (name === 'Escalas') {
        header = ['Tarefa', 'Voluntário'];
      } else if (name === 'Logs') {
        header = ['Data', 'Hora', 'Usuário', 'Ação', 'Item'];
      } else if (name === 'Sessões') {
        header = ['SESSÃO', 'DATA', 'HORA', 'ESCALA', 'GRAU', 'DESCRIÇÃO', 'CRIADO_EM', 'CRIADO_POR'];
      }
      
      if (header.length > 0) {
        sheet.appendRow(header);
      }
    }
    return sheet;
  } catch (e) {
    Logger.log('[getSheet] Erro crítico ao acessar planilha: ' + e.toString());
    throw new Error('Erro na planilha. Verifique ID e permissões.');
  }
}

function logAction(user, action, item) {
  try {
    const sheet = getSheet('Logs');
    const now = new Date();
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const timeZone = ss.getSpreadsheetTimeZone();
    const dataStr = Utilities.formatDate(now, timeZone, "dd/MM/yyyy");
    const horaStr = Utilities.formatDate(now, timeZone, "HH:mm:ss");
    sheet.appendRow([dataStr, horaStr, user, action, item]);
  } catch (err) {
    Logger.log('[logAction] Erro ao salvar log: ' + err.toString());
  }
}

// --- AUXILIARES ---

function getOrgaName() {
  try {
    const sheet = getSheet('Membros');
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][8] && String(data[i][8]).trim() === 'Orgã') {
        return data[i][0];
      }
    }
    return "Não definido";
  } catch (err) {
    return "Erro ao buscar";
  }
}

function getAuxiliares() {
  try {
    const sheet = getSheet('Membros');
    const data = sheet.getDataRange().getValues();
    const list = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][8] && String(data[i][8]).trim() === 'Auxiliar') {
        list.push(data[i][0]);
      }
    }
    return list;
  } catch (err) {
    return [];
  }
}

function getNextSessionData() {
  Logger.log('[getNextSessionData] Iniciando busca da próxima sessão...');
  try {
    const allSessions = getSessions();
    const now = new Date();
    
    // Filtra sessões futuras ou do dia atual
    const futureSessions = allSessions.filter(s => {
      if (!s.data) return false;
      const sDate = new Date(s.data);
      
      // Cria data de hoje zerada para comparação justa (ignorando hora passada no dia)
      const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sessionDateZero = new Date(sDate.getUTCFullYear(), sDate.getUTCMonth(), sDate.getUTCDate());

      return sessionDateZero >= todayZero;
    });

    // Ordena por data (mais próxima primeiro)
    futureSessions.sort((a, b) => new Date(a.data) - new Date(b.data));

    if (futureSessions.length > 0) {
      Logger.log('[getNextSessionData] Próxima sessão encontrada: ' + JSON.stringify(futureSessions[0]));
      return futureSessions[0];
    }
    Logger.log('[getNextSessionData] Nenhuma sessão futura encontrada.');
    return null;
  } catch (err) {
    Logger.log('[getNextSessionData] Erro: ' + err.toString());
    return null;
  }
}

// --- LÓGICA DE USUÁRIOS ---

function registerUser(form) {
  try {
    const sheet = getSheet('Membros');
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Nome', 'Nascimento', 'Telefone', 'Genero', 'Escala', 'Grau', 'Username', 'Senha', 'Cargo']);
    }
    const data = sheet.getDataRange().getValues();
    const cleanPhone = String(form.telefone).replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      return { success: false, message: 'O número de telefone deve conter exatamente 11 dígitos (com DDD).' };
    }
    const username = cleanPhone; 
    let password = '';
    if (form.data_nascimento) {
      const parts = form.data_nascimento.split('-'); 
      if (parts.length === 3) password = parts[2] + parts[1] + parts[0]; 
    }
    for (let i = 1; i < data.length; i++) {
      const dbPhone = String(data[i][2]).replace(/\D/g, '');
      const dbUsername = String(data[i][6]).replace(/\D/g, '');
      if (dbPhone === username || dbUsername === username) {
        return { success: false, message: `Você é ${data[i][0]}? Realize o login com o número e sua data de nascimento.` };
      }
    }
    sheet.appendRow([form.nome, form.data_nascimento, cleanPhone, form.genero, form.escala || "A definir", form.grau, username, password, form.cargo]);
    logAction(username, 'Cadastro', 'Novo Usuário');
    return { success: true, message: `Cadastro realizado! Login: ${username}, Senha: ${password}` };
  } catch (err) {
    return { success: false, message: 'Erro interno ao registrar: ' + err.toString() };
  }
}

function loginUser(username, password) {
  try {
    const sheet = getSheet('Membros');
    if (sheet.getLastRow() < 2) return { success: false, message: 'Nenhum usuário cadastrado.' };
    const data = sheet.getDataRange().getValues();
    const cleanUsername = String(username).replace(/\D/g, '');
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const dbUsername = String(row[6]).replace(/\D/g, '');
      if (dbUsername === cleanUsername && String(row[7]).trim() == String(password).trim()) {
        return { success: true, user: { nome: row[0], telefone: row[2], genero: row[3], escala: row[4], grau: row[5], cargo: row[8] || 'Sócio' } };
      }
    }
    return { success: false, message: 'Credenciais inválidas.' };
  } catch (err) {
    return { success: false, message: 'Erro no servidor durante o login.' };
  }
}

// --- LÓGICA DE LANCHES ---

function getLanches() {
  try {
    const sheet = getSheet('Lanches');
    if (sheet.getLastRow() <= 1) {
      if (sheet.getLastRow() === 0) sheet.appendRow(['Item', 'Pessoa']);
      // REMOVIDO DADOS DE EXEMPLO AUTOMÁTICOS PARA NÃO POLUIR
    }
    let list = [];
    if (sheet.getLastRow() > 1) {
      const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
      list = data.map((row, index) => ({ name: row[0], pessoa: row[1], rowIndex: index + 2 }));
    }
    return { items: list, nextSession: getNextSessionData(), orga: getOrgaName(), auxiliares: getAuxiliares() };
  } catch (err) {
    return { items: [], nextSession: null, orga: "Erro", auxiliares: [] };
  }
}

function addLanche(foodName, userName) {
  try {
    const sheet = getSheet('Lanches');
    sheet.appendRow([foodName, 'Disponível']);
    logAction(userName, 'Adicionou Item', foodName);
    return getLanches();
  } catch (err) {
    return getLanches();
  }
}

function updateLancheStatus(rowIndex, userName) {
  try {
    const sheet = getSheet('Lanches');
    const statusRange = sheet.getRange(rowIndex, 2);
    const currentStatus = statusRange.getValue();
    if (currentStatus === 'Disponível') statusRange.setValue(userName);
    else if (currentStatus === userName) statusRange.setValue('Disponível');
    else return { success: false, message: 'Item já ocupado.' };
    return { success: true, data: getLanches() };
  } catch (err) {
    return { success: false, message: 'Erro ao atualizar.' };
  }
}

// --- LÓGICA DE ESCALAS ---

function getEscalas() {
  try {
    const sheet = getSheet('Escalas');
    if (sheet.getLastRow() <= 1) {
      if (sheet.getLastRow() === 0) sheet.appendRow(['Tarefa', 'Voluntário']);
      // REMOVIDO DADOS DE EXEMPLO
    }
    let list = [];
    if (sheet.getLastRow() > 1) {
      const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
      list = data.map((row, index) => ({ name: row[0], pessoa: row[1], rowIndex: index + 2 }));
    }
    return { items: list, nextSession: getNextSessionData(), orga: getOrgaName(), auxiliares: getAuxiliares() };
  } catch (err) {
    return { items: [], nextSession: null, orga: "Erro", auxiliares: [] };
  }
}

function addEscala(taskName, userName) {
  try {
    const sheet = getSheet('Escalas');
    sheet.appendRow([taskName, 'Disponível']);
    logAction(userName, 'Adicionou Tarefa', taskName);
    return getEscalas();
  } catch (err) {
    return getEscalas();
  }
}

function updateEscalaStatus(rowIndex, userName) {
  try {
    const sheet = getSheet('Escalas');
    const statusRange = sheet.getRange(rowIndex, 2); 
    const currentStatus = statusRange.getValue();
    if (currentStatus === 'Disponível') statusRange.setValue(userName);
    else if (currentStatus === userName) statusRange.setValue('Disponível');
    else return { success: false, message: 'Tarefa já ocupada.' };
    return { success: true, data: getEscalas() };
  } catch (err) {
    return { success: false, message: 'Erro ao atualizar.' };
  }
}

// --- LÓGICA DE SESSÕES ---

function getSessions() {
  Logger.log('[getSessions] Buscando sessões...');
  try {
    const sheet = getSheet('Sessões');
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return []; 
    
    // Lê 8 colunas como STRING para evitar conversão automática errada
    const data = sheet.getRange(2, 1, lastRow - 1, 8).getDisplayValues();
    
    const parsedSessions = data.map((row, index) => {
      let dateStr = row[1];
      let parsedDate = null;
      
      // Parser manual de data DD/MM/YYYY ou YYYY-MM-DD
      if (dateStr && typeof dateStr === 'string') {
          dateStr = dateStr.trim();
          if (dateStr.includes('/')) { 
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                // Cria UTC: Ano, Mês (0-11), Dia
                parsedDate = new Date(Date.UTC(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))).toISOString();
              }
          } else if (dateStr.includes('-')) {
              const parts = dateStr.split('-');
              if (parts.length === 3) {
                parsedDate = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))).toISOString();
              }
          }
      }

      const nomeSessao = String(row[0]).trim();
      let corSessao = '#999999';
      if (nomeSessao.includes('Preparo')) corSessao = '#8E44AD';
      else if (nomeSessao.includes('Extra')) corSessao = '#E59400';
      else if (nomeSessao.includes('Anual')) corSessao = '#1C305C';
      else if (nomeSessao.includes('Instrutiva')) corSessao = '#D35400';
      else if (nomeSessao.includes('Escala')) corSessao = '#006400'; // AGORA É SÓ "Preparo"
      
      return {
        sessao: nomeSessao, 
        data: parsedDate, 
        hora: row[2], 
        escala: row[3], 
        grau: row[4], 
        descricao: row[5], 
        criado_em: row[6], 
        criado_por: row[7],
        cor: corSessao
      };
    });

    // FILTRO: Apenas sessões válidas (com data)
    // Nota: O filtro de "mês atual" removi daqui para permitir que o getNextSessionData
    // possa olhar para qualquer data futura, não só deste mês.
    const validSessions = parsedSessions.filter(s => s.data);

    return validSessions;

  } catch (err) {
    Logger.log('[getSessions] Erro crítico: ' + err.toString());
    return [];
  }
}

function addSession(form, userName) {
  try {
    const sheet = getSheet('Sessões');
    if (form.descricao && form.descricao.length > 140) return { success: false, message: 'A descrição excede 140 caracteres.' };
    
    // Validação de Data Futura
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const timeZone = ss.getSpreadsheetTimeZone();
    const todayStr = Utilities.formatDate(new Date(), timeZone, "yyyy-MM-dd");
    
    if (form.data < todayStr) {
      return { success: false, message: 'Não é possível agendar sessões em datas passadas.' };
    }

    const nowFormatted = Utilities.formatDate(new Date(), timeZone, "dd/MM/yyyy HH:mm");

    // Salva a data como String YYYY-MM-DD para garantir consistência
    sheet.appendRow([
      form.tipo, 
      form.data, // YYYY-MM-DD
      form.hora, 
      form.escala, 
      "Todos", 
      form.descricao, 
      nowFormatted, 
      userName
    ]);
    
    logAction(userName, 'Agendou Sessão', form.tipo);
    return { success: true, data: getSessions() };
  } catch (err) {
    return { success: false, message: 'Erro ao agendar: ' + err.toString() };
  }
}