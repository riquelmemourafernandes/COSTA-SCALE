import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Cached state - pre-populated strictly with real data from Google Sheets
  let cachedSheetsClient: any = null;
  let cachedFleet: any[] | null = null;
  let cachedMaintenance: any[] | null = null;
  let cachedAgregados: any[] | null = null;
  let lastCacheTime = 0;
  let inFlightFetch: Promise<{ fleet: any[]; maintenance: any[]; agregados: any[] }> | null = null;
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

  // Helper to parse pure real rows from Sheets
  const processRawRows = (fleetRows: any[][], maintRows: any[][], agregRows: any[][]) => {
    const fleet: any[] = [];
    fleetRows.forEach((r, idx) => {
      const cavalo = (r[7] || "").trim().toUpperCase();
      const date = (r[12] || "").trim();
      if (!cavalo || !date) return;

      let status = (r[11] || "DISPONÍVEL").trim().toUpperCase();
      if (status.includes("MANUTEN")) status = "EM MANUTENÇÃO";
      else if (status === "Á ESCALAR" || status === "A ESCALAR") status = "DISPONÍVEL";
      else if (status === "RETORNO DE VIAGEM") status = "A CAMINHO";
      else if (status === "REVISÃO") status = "EM MANUTENÇÃO";
      else if (status === "FÉRIAS") status = "FORA DE ESCALA";

      const tag = (r[0] || "").trim();
      const obs = (r[1] || "").trim();
      const mopp = (r[2] || "").trim();
      const ddd = (r[3] || "").trim();
      const t4s = (r[4] || "").trim().toUpperCase() === "POSSUI" || (r[4] || "").trim().toUpperCase() === "TRUE";
      const tipo = (r[6] || "").trim().toUpperCase();
      const carreta = (r[8] || "").trim().toUpperCase();
      const motorista = (r[9] || "").trim();
      const contato = (r[10] || "").trim();
      const local = (r[13] || "").trim();

      fleet.push({
        id: String(idx + 1),
        tag,
        obs,
        mopp,
        ddd,
        t4s,
        tipo,
        cavalo,
        carreta,
        motorista,
        contato,
        status,
        date,
        local,
        lastUpdate: date
      });
    });

    const maintenance: any[] = [];
    maintRows.forEach((r, idx) => {
      const cavalo = (r[2] || "").trim().toUpperCase();
      if (!cavalo) return;
      maintenance.push({
        id: String(idx + 1),
        dataHoraEntrada: (r[0] || "").trim(),
        motorista: (r[1] || "").trim(),
        cavalo,
        carreta1: (r[3] || "").trim().toUpperCase(),
        carreta2: (r[4] || "").trim().toUpperCase(),
        motivo: (r[5] || "").trim(),
        observacao: (r[6] || "").trim(),
        previsaoSaida: (r[7] || "").trim(),
        horasParadas: (r[8] || "").trim(),
        dataHoraSaida: (r[9] || "").trim()
      });
    });

    const agregados: any[] = [];
    agregRows.forEach((r, idx) => {
      const cavalo = (r[2] || "").trim().toUpperCase();
      if (!cavalo) return;
      agregados.push({
        id: String(idx + 1),
        status: (r[0] || "").trim().toUpperCase(),
        tipoCont: (r[1] || "").trim().toUpperCase(),
        cavalo,
        carreta: (r[3] || "").trim().toUpperCase(),
        codAbast: (r[4] || "").trim(),
        motorista: (r[5] || "").trim(),
        telMot: (r[6] || "").trim(),
        proprietario: (r[7] || "").trim(),
        inicio: (r[8] || "").trim(),
        observacao: (r[9] || "").trim(),
        bugAlugado: (r[10] || "").trim(),
        seguro: (r[11] || "").trim(),
        contrato: (r[12] || "").trim()
      });
    });

    return { fleet, maintenance, agregados };
  };

  // Load from local disk cache immediately on boot
  try {
    if (fs.existsSync(".fleet_raw.json")) {
      const raw = JSON.parse(fs.readFileSync(".fleet_raw.json", "utf-8"));
      if (raw && raw.fleetRows && raw.fleetRows.length > 0) {
        const parsed = processRawRows(raw.fleetRows, raw.maintRows || [], raw.agregRows || []);
        cachedFleet = parsed.fleet;
        cachedMaintenance = parsed.maintenance;
        cachedAgregados = parsed.agregados;
        lastCacheTime = Date.now();
        console.log(`⚡ Inicialização instantânea: ${cachedFleet.length} registros da frota carregados do cache local.`);
      }
    }
  } catch (err: any) {
    console.warn("Aviso ao ler cache local:", err.message);
  }

  // Fetch real fleet data directly from Google Sheets (batchGet)
  const fetchRealFleetFromSheets = async (sheets: any, sheetId: string) => {
    console.log("📊 Sincronizando dados 100% reais das abas 'Fleet', 'MANUTENÇÃO' e 'AGREGADOS' via batchGet...");
    
    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges: ["'Fleet'!A2:N21000", "'MANUTENÇÃO'!A2:J100", "'AGREGADOS'!A2:M50"]
    });

    const fleetRows: any[][] = res.data.valueRanges?.[0]?.values || [];
    const maintRows: any[][] = res.data.valueRanges?.[1]?.values || [];
    const agregRows: any[][] = res.data.valueRanges?.[2]?.values || [];

    // Save to disk cache for instantaneous boot
    try {
      fs.writeFileSync(".fleet_raw.json", JSON.stringify({ fleetRows, maintRows, agregRows }));
    } catch (e: any) {
      console.warn("Não foi possível salvar cache em disco:", e.message);
    }

    const { fleet, maintenance, agregados } = processRawRows(fleetRows, maintRows, agregRows);
    console.log(`✅ Sucesso! Sincronizados ${fleet.length} registros reais de frota, ${maintenance.length} de manutenção e ${agregados.length} agregados (100% REAIS).`);
    return { fleet, maintenance, agregados };
  };

  // Google Sheets Auth Helper (singleton / cached)
  const getGoogleSheetsClient = async () => {
    if (cachedSheetsClient) return cachedSheetsClient;

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
    let privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();

    if (!email || !privateKey) return null;

    try {
      privateKey = privateKey.replace(/^["']|["']$/g, '').trim();
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      const auth = new google.auth.JWT({
        email: email,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
      });

      cachedSheetsClient = google.sheets({ version: "v4", auth });
      return cachedSheetsClient;
    } catch (err: any) {
      console.error("❌ ERRO NA AUTENTICAÇÃO (JWT):", err.message);
      return null;
    }
  };

  const getOrFetchAllData = async (forceRefresh = false) => {
    const now = Date.now();
    if (!forceRefresh && cachedFleet && cachedFleet.length > 0 && (now - lastCacheTime < CACHE_TTL_MS)) {
      return { fleet: cachedFleet, maintenance: cachedMaintenance || [], agregados: cachedAgregados || [] };
    }

    if (inFlightFetch) {
      return inFlightFetch;
    }

    const sheetId = process.env.GOOGLE_SHEET_ID?.trim();
    const sheets = await getGoogleSheetsClient();

    if (!sheets || !sheetId) {
      return { fleet: cachedFleet || [], maintenance: cachedMaintenance || [], agregados: cachedAgregados || [] };
    }

    inFlightFetch = (async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout ao conectar à planilha")), 90000)
        );

        const fetchPromise = fetchRealFleetFromSheets(sheets, sheetId);
        const result: any = await Promise.race([fetchPromise, timeoutPromise]);

        if (result && result.fleet && result.fleet.length > 0) {
          cachedFleet = result.fleet;
          cachedMaintenance = result.maintenance;
          cachedAgregados = result.agregados;
          lastCacheTime = Date.now();
          return result;
        }

        return { fleet: cachedFleet || [], maintenance: cachedMaintenance || [], agregados: cachedAgregados || [] };
      } catch (error: any) {
        console.error("❌ ERRO GOOGLE SHEETS API:", error.message);
        return { fleet: cachedFleet || [], maintenance: cachedMaintenance || [], agregados: cachedAgregados || [] };
      } finally {
        inFlightFetch = null;
      }
    })();

    return inFlightFetch;
  };

  // API Routes
  app.get("/api/fleet", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const forceRefresh = req.query.refresh === 'true';
    const dateQuery = req.query.date as string | undefined;

    try {
      const data = await getOrFetchAllData(forceRefresh);
      let fleet = data.fleet || [];

      if (dateQuery) {
        const target = dateQuery.trim();
        fleet = fleet.filter(v => v.date === target);
      }

      return res.json(fleet);
    } catch (err: any) {
      console.error("Falha inesperada ao processar /api/fleet:", err);
      return res.json(cachedFleet || []);
    }
  });

  app.get("/api/maintenance", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const data = await getOrFetchAllData(req.query.refresh === 'true');
      return res.json(data.maintenance || []);
    } catch (err: any) {
      return res.json(cachedMaintenance || []);
    }
  });

  app.get("/api/agregados", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const data = await getOrFetchAllData(req.query.refresh === 'true');
      return res.json(data.agregados || []);
    } catch (err: any) {
      return res.json(cachedAgregados || []);
    }
  });

  app.post("/api/sync", async (req, res) => {
    try {
      const data = await getOrFetchAllData(true);
      return res.json({ success: true, count: data.fleet.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
