import { google } from "googleapis";

type SheetRow = Array<string | number | boolean | null | undefined>;

const cell = (row: SheetRow, index: number) => String(row[index] ?? "").trim();

function parseFleet(rows: SheetRow[]) {
  return rows.flatMap((row, index) => {
    const cavalo = cell(row, 7).toUpperCase();
    const date = cell(row, 12);
    if (!cavalo || !date) return [];

    let status = (cell(row, 11) || "DISPONÍVEL").toUpperCase();
    if (status.includes("MANUTEN")) status = "EM MANUTENÇÃO";
    else if (status === "Á ESCALAR" || status === "A ESCALAR") status = "DISPONÍVEL";
    else if (status === "RETORNO DE VIAGEM") status = "A CAMINHO";
    else if (status === "REVISÃO") status = "EM MANUTENÇÃO";
    else if (status === "FÉRIAS") status = "FORA DE ESCALA";

    const t4sValue = cell(row, 4).toUpperCase();

    return [{
      id: String(index + 1),
      tag: cell(row, 0),
      obs: cell(row, 1),
      mopp: cell(row, 2),
      ddd: cell(row, 3),
      t4s: t4sValue === "POSSUI" || t4sValue === "TRUE",
      tipo: cell(row, 6).toUpperCase(),
      cavalo,
      carreta: cell(row, 8).toUpperCase(),
      motorista: cell(row, 9),
      contato: cell(row, 10),
      status,
      date,
      local: cell(row, 13),
      lastUpdate: date,
    }];
  });
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID?.trim();

  if (!email || !privateKeyRaw || !spreadsheetId) {
    console.error("Google Sheets não configurado: faltam variáveis de ambiente.");
    return res.status(500).json({
      error: "Integração Google Sheets não configurada. Confira GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY e GOOGLE_SHEET_ID nas variáveis de ambiente da Vercel.",
    });
  }

  try {
    const privateKey = privateKeyRaw
      .replace(/^[\"']|[\"']$/g, "")
      .replace(/\\n/g, "\n");

    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // A Vercel executa esta rota como função serverless. Cada chamada lê a planilha
    // diretamente; o botão de sincronização não depende do cache em memória do Express.
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "'Fleet'!A2:N21000",
      majorDimension: "ROWS",
    });

    const fleet = parseFleet((result.data.values || []) as SheetRow[]);
    const dateQuery = typeof req.query?.date === "string" ? req.query.date.trim() : "";
    const filteredFleet = dateQuery ? fleet.filter((vehicle) => vehicle.date === dateQuery) : fleet;

    res.setHeader("X-Sheets-Synced", "true");
    res.setHeader("X-Sheets-Count", String(filteredFleet.length));
    return res.status(200).json(filteredFleet);
  } catch (error: any) {
    const message = String(error?.message || "Erro desconhecido ao consultar Google Sheets");
    console.error("Erro na função /api/fleet:", message);
    const status = Number(error?.code) === 403 ? 403 : Number(error?.code) === 404 ? 404 : 500;
    return res.status(status).json({
      error: status === 403
        ? "A conta de serviço não tem permissão para ler a planilha. Compartilhe a planilha com GOOGLE_SERVICE_ACCOUNT_EMAIL como leitor."
        : status === 404
          ? "Planilha não encontrada. Confira GOOGLE_SHEET_ID e o nome da aba Fleet."
          : "Falha ao sincronizar com Google Sheets. Confira as variáveis de ambiente e os logs da função na Vercel.",
      details: message,
    });
  }
}
