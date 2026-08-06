export default async function handler(req, res) {
  const { AIRTABLE_PAT, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME } = process.env;

  // Verifica se as variáveis existem na Vercel
  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    return res.status(500).json({ 
      error: "Variáveis de ambiente ausentes no servidor da Vercel.",
      missing: {
        pat: !AIRTABLE_PAT,
        baseId: !AIRTABLE_BASE_ID,
        tableName: !AIRTABLE_TABLE_NAME
      }
    });
  }

  try {
    let allRecords = [];
    let offset = null;

    // Loop para buscar TODAS as páginas do Airtable (sem limite de 100 itens)
    do {
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;
      if (offset) {
        url += `?offset=${offset}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT.trim()}`,
        },
      });

      const data = await response.json();

      // Se o Airtable recusar (ex: erro 401, 404, etc), mostra a resposta real
      if (!response.ok) {
        return res.status(response.status).json({
          error: "Airtable recusou a requisição",
          status: response.status,
          airtableMessage: data
        });
      }

      if (data.records) {
        allRecords = allRecords.concat(data.records);
      }

      offset = data.offset; // Se houver mais de 100 registros, o Airtable devolve o 'offset'
    } while (offset);

  // Trata e formata todos os produtos
    const produtos = allRecords.map(record => ({
      id: record.id,
      nome: record.fields.Nome || 'Produto sem nome',
      categoria: record.fields.Categoria || 'Geral',
      preco: record.fields.Preco || 'Sob consulta',
      status: record.fields.Status || 'Disponível',
      foto: record.fields.Foto?.[0]?.url || '',
      descricao: record.fields.Descrição || record.fields.Descricao || '',
      marca: record.fields.Marca || '' // <-- ADICIONE ESTA LINHA
    }));
    return res.status(200).json(produtos);
  } catch (error) {
    return res.status(500).json({ error: "Erro interno", details: error.message });
  }
}