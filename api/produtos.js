export default async function handler(req, res) {
  // Permite apenas requisições GET (Leitura)
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Produtos';

  if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Configuração de servidor incompleta.' });
  }

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_PAT}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erro Airtable: ${response.status}`);
    }

    const data = await response.json();
    
    // Retorna apenas os campos estritamente necessários para a tela
    const cleanRecords = data.records.map(record => ({
      id: record.id,
      nome: record.fields.Nome || '',
      categoria: record.fields.Categoria || 'Outros',
      preco: record.fields.Preco ? `R$ ${record.fields.Preco}` : '',
      status: record.fields.Status || 'Disponível',
      foto: record.fields.Foto && record.fields.Foto[0] ? record.fields.Foto[0].url : ''
    }));

    // Cache de 60 segundos para evitar estouro de requisições
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(cleanRecords);

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar dados com segurança.' });
  }
}