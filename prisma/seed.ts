import {
  PrismaClient,
  type ClaimStatus,
  type ClaimType,
  type Coverage,
  type RepairAction,
  type Severity,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { formatProtocol } from "../src/domain/protocol";

const prisma = new PrismaClient();
const PASSWORD = "safety123";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const daysAgo = (d: number, hours = 0) => new Date(now - d * DAY + hours * 60 * 60 * 1000);

type Step = { to: ClaimStatus; by: string; message: string; at: Date };

async function main() {
  // Limpa na ordem das dependências
  await prisma.claimEvent.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.claimDamage.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.protocolSequence.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const seguradora = await prisma.user.create({
    data: { name: "Carla Mendes (Analista)", email: "seguradora@safetycare.test", passwordHash, role: "SEGURADORA" },
  });
  const oficina1 = await prisma.user.create({
    data: { name: "Auto Center Prime", email: "oficina1@safetycare.test", passwordHash, role: "OFICINA" },
  });
  const oficina2 = await prisma.user.create({
    data: { name: "MotoFix Oficina", email: "oficina2@safetycare.test", passwordHash, role: "OFICINA" },
  });
  const ana = await prisma.user.create({
    data: { name: "Ana Souza", email: "ana@safetycare.test", passwordHash, role: "CLIENTE" },
  });
  const bruno = await prisma.user.create({
    data: { name: "Bruno Lima", email: "bruno@safetycare.test", passwordHash, role: "CLIENTE" },
  });

  const validUntil = new Date(Date.UTC(2027, 11, 31));

  const onix = await prisma.vehicle.create({
    data: {
      ownerId: ana.id, type: "CARRO", brand: "Chevrolet", model: "Onix LT", year: 2022, plate: "RTA1B23", color: "#9aa3ad",
      policies: { create: { number: "AP-2026-0001", deductible: 250_000, validUntil } },
    },
    include: { policies: true },
  });
  const cg = await prisma.vehicle.create({
    data: {
      ownerId: ana.id, type: "MOTO", brand: "Honda", model: "CG 160 Titan", year: 2023, plate: "QWE4R56", color: "#b3261e",
      policies: { create: { number: "AP-2026-0002", deductible: 90_000, validUntil } },
    },
    include: { policies: true },
  });
  const hb20 = await prisma.vehicle.create({
    data: {
      ownerId: bruno.id, type: "CARRO", brand: "Hyundai", model: "HB20 Comfort", year: 2021, plate: "BRA2E19", color: "#1f3b73",
      policies: { create: { number: "AP-2026-0003", deductible: 200_000, validUntil } },
    },
    include: { policies: true },
  });

  let seq = 0;
  const year = new Date().getUTCFullYear();

  async function createClaim(args: {
    policyId: string;
    clientId: string;
    type: ClaimType;
    description: string;
    location: string;
    occurredAt: Date;
    createdAt: Date;
    workshopId?: string;
    adjusterId?: string;
    damages: { partKey: string; severity: Severity; note?: string }[];
    steps: Step[];
  }) {
    seq += 1;
    const finalStatus = args.steps.at(-1)?.to ?? "ABERTO";
    const claim = await prisma.claim.create({
      data: {
        protocol: formatProtocol(year, seq),
        policyId: args.policyId,
        clientId: args.clientId,
        workshopId: args.workshopId,
        adjusterId: args.adjusterId,
        type: args.type,
        description: args.description,
        location: args.location,
        occurredAt: args.occurredAt,
        createdAt: args.createdAt,
        updatedAt: args.steps.at(-1)?.at ?? args.createdAt,
        status: finalStatus,
        damages: { create: args.damages.map((d) => ({ ...d, source: "CLIENTE" as const })) },
        events: {
          create: [
            {
              actorId: args.clientId,
              type: "CRIACAO",
              toStatus: "ABERTO",
              message: "Sinistro aberto pelo segurado.",
              createdAt: args.createdAt,
            },
          ],
        },
      },
    });
    let from: ClaimStatus = "ABERTO";
    for (const step of args.steps) {
      await prisma.claimEvent.create({
        data: {
          claimId: claim.id,
          actorId: step.by,
          type: "STATUS",
          fromStatus: from,
          toStatus: step.to,
          message: step.message,
          createdAt: step.at,
        },
      });
      from = step.to;
    }
    return claim;
  }

  async function createQuote(args: {
    claimId: string;
    workshopId: string;
    version: number;
    status: "ENVIADO" | "APROVADO" | "AJUSTE_SOLICITADO";
    estimatedDays: number;
    items: { partKey: string; action: RepairAction; partPrice: number; laborPrice: number; coverage?: Coverage; insurerNote?: string }[];
  }) {
    const partsTotal = args.items.reduce((s, i) => s + i.partPrice, 0);
    const laborTotal = args.items.reduce((s, i) => s + i.laborPrice, 0);
    return prisma.quote.create({
      data: {
        claimId: args.claimId,
        workshopId: args.workshopId,
        version: args.version,
        status: args.status,
        estimatedDays: args.estimatedDays,
        partsTotal,
        laborTotal,
        items: { create: args.items.map((i) => ({ ...i, coverage: i.coverage ?? "PENDENTE" })) },
      },
    });
  }

  // 1) ABERTO — Ana, Onix, colisão traseira recente
  await createClaim({
    policyId: onix.policies[0].id,
    clientId: ana.id,
    type: "COLISAO",
    description: "Fui atingida na traseira enquanto aguardava o semáforo abrir.",
    location: "Av. Paulista, 1500 — São Paulo/SP",
    occurredAt: daysAgo(1, -3),
    createdAt: daysAgo(1),
    damages: [
      { partKey: "parachoque_traseiro", severity: "GRAVE", note: "Rachado e solto do lado direito" },
      { partKey: "tampa_porta_malas", severity: "MEDIO", note: "Amassado próximo à placa" },
      { partKey: "lanterna_dir", severity: "GRAVE", note: "Quebrada" },
    ],
    steps: [],
  });

  // 2) ENCAMINHADO_OFICINA — Ana, moto, queda
  await createClaim({
    policyId: cg.policies[0].id,
    clientId: ana.id,
    workshopId: oficina2.id,
    adjusterId: seguradora.id,
    type: "COLISAO",
    description: "Derrapei em óleo na pista e a moto tombou do lado esquerdo.",
    location: "R. Augusta, 300 — São Paulo/SP",
    occurredAt: daysAgo(4),
    createdAt: daysAgo(4, 2),
    damages: [
      { partKey: "carenagem_esq", severity: "MEDIO", note: "Riscos profundos" },
      { partKey: "retrovisor_esq", severity: "GRAVE", note: "Quebrado" },
      { partKey: "guidao", severity: "LEVE" },
    ],
    steps: [
      { to: "EM_ANALISE", by: seguradora.id, message: "Sinistro assumido para análise.", at: daysAgo(3) },
      { to: "ENCAMINHADO_OFICINA", by: seguradora.id, message: "Encaminhado à oficina MotoFix Oficina.", at: daysAgo(2) },
    ],
  });

  // 3) ORCAMENTO_ENVIADO — Bruno, HB20, colisão lateral; aguardando decisão da seguradora
  const c3 = await createClaim({
    policyId: hb20.policies[0].id,
    clientId: bruno.id,
    workshopId: oficina1.id,
    adjusterId: seguradora.id,
    type: "COLISAO",
    description: "Outro veículo invadiu a faixa e raspou a lateral direita.",
    location: "Marginal Pinheiros, km 12 — São Paulo/SP",
    occurredAt: daysAgo(9),
    createdAt: daysAgo(9, 4),
    damages: [
      { partKey: "porta_dianteira_dir", severity: "GRAVE", note: "Amassado profundo" },
      { partKey: "porta_traseira_dir", severity: "MEDIO" },
      { partKey: "retrovisor_dir", severity: "GRAVE", note: "Arrancado" },
    ],
    steps: [
      { to: "EM_ANALISE", by: seguradora.id, message: "Sinistro assumido para análise.", at: daysAgo(8) },
      { to: "ENCAMINHADO_OFICINA", by: seguradora.id, message: "Encaminhado à oficina Auto Center Prime.", at: daysAgo(7) },
      { to: "AGUARDANDO_ORCAMENTO", by: oficina1.id, message: "Veículo recebido na oficina.", at: daysAgo(6) },
      { to: "ORCAMENTO_ENVIADO", by: oficina1.id, message: "Orçamento v1 enviado para análise.", at: daysAgo(5) },
    ],
  });
  await createQuote({
    claimId: c3.id,
    workshopId: oficina1.id,
    version: 1,
    status: "ENVIADO",
    estimatedDays: 7,
    items: [
      { partKey: "porta_dianteira_dir", action: "TROCAR", partPrice: 210_000, laborPrice: 45_000 },
      { partKey: "porta_traseira_dir", action: "REPARAR", partPrice: 0, laborPrice: 60_000 },
      { partKey: "retrovisor_dir", action: "TROCAR", partPrice: 68_000, laborPrice: 8_000 },
      { partKey: "paralama_traseiro_dir", action: "PINTAR", partPrice: 0, laborPrice: 35_000 },
    ],
  });

  // 4) PRONTO_PARA_RETIRADA — Ana, Onix, orçamento parcialmente coberto
  const c4 = await createClaim({
    policyId: onix.policies[0].id,
    clientId: ana.id,
    workshopId: oficina1.id,
    adjusterId: seguradora.id,
    type: "COLISAO",
    description: "Colisão frontal leve em estacionamento de shopping.",
    location: "Shopping Eldorado — São Paulo/SP",
    occurredAt: daysAgo(40),
    createdAt: daysAgo(40, 3),
    damages: [
      { partKey: "parachoque_dianteiro", severity: "GRAVE" },
      { partKey: "capo", severity: "MEDIO", note: "Amassado na ponta" },
      { partKey: "farol_esq", severity: "GRAVE", note: "Lente trincada" },
      { partKey: "paralama_dianteiro_esq", severity: "LEVE", note: "Riscos" },
    ],
    steps: [
      { to: "EM_ANALISE", by: seguradora.id, message: "Sinistro assumido para análise.", at: daysAgo(39) },
      { to: "ENCAMINHADO_OFICINA", by: seguradora.id, message: "Encaminhado à oficina Auto Center Prime.", at: daysAgo(38) },
      { to: "AGUARDANDO_ORCAMENTO", by: oficina1.id, message: "Veículo recebido na oficina.", at: daysAgo(37) },
      { to: "ORCAMENTO_ENVIADO", by: oficina1.id, message: "Orçamento v1 enviado para análise.", at: daysAgo(36) },
      { to: "AJUSTE_SOLICITADO", by: seguradora.id, message: "Valor do farol acima da tabela. Revisar.", at: daysAgo(35) },
      { to: "ORCAMENTO_ENVIADO", by: oficina1.id, message: "Orçamento v2 enviado para análise.", at: daysAgo(34) },
      { to: "ORCAMENTO_APROVADO", by: seguradora.id, message: "Orçamento aprovado parcialmente.", at: daysAgo(33) },
      { to: "EM_REPARO", by: oficina1.id, message: "Reparo iniciado.", at: daysAgo(32) },
      { to: "PRONTO_PARA_RETIRADA", by: oficina1.id, message: "Veículo pronto para retirada.", at: daysAgo(2) },
    ],
  });
  await createQuote({
    claimId: c4.id,
    workshopId: oficina1.id,
    version: 1,
    status: "AJUSTE_SOLICITADO",
    estimatedDays: 6,
    items: [
      { partKey: "parachoque_dianteiro", action: "TROCAR", partPrice: 140_000, laborPrice: 30_000 },
      { partKey: "capo", action: "REPARAR", partPrice: 0, laborPrice: 55_000 },
      { partKey: "farol_esq", action: "TROCAR", partPrice: 160_000, laborPrice: 10_000 },
      { partKey: "paralama_dianteiro_esq", action: "PINTAR", partPrice: 0, laborPrice: 40_000 },
    ],
  });
  await createQuote({
    claimId: c4.id,
    workshopId: oficina1.id,
    version: 2,
    status: "APROVADO",
    estimatedDays: 6,
    items: [
      { partKey: "parachoque_dianteiro", action: "TROCAR", partPrice: 140_000, laborPrice: 30_000, coverage: "COBERTO" },
      { partKey: "capo", action: "REPARAR", partPrice: 0, laborPrice: 55_000, coverage: "COBERTO" },
      { partKey: "farol_esq", action: "TROCAR", partPrice: 115_000, laborPrice: 10_000, coverage: "COBERTO" },
      {
        partKey: "paralama_dianteiro_esq",
        action: "PINTAR",
        partPrice: 0,
        laborPrice: 40_000,
        coverage: "NAO_COBERTO",
        insurerNote: "Riscos preexistentes, não relacionados ao evento.",
      },
    ],
  });
  await prisma.claimEvent.createMany({
    data: [
      {
        claimId: c4.id, actorId: oficina1.id, type: "MENSAGEM", createdAt: daysAgo(36, 1),
        message: "O farol original está em falta; cotamos o do fabricante.",
      },
      {
        claimId: c4.id, actorId: seguradora.id, type: "COBERTURA", createdAt: daysAgo(33, 1),
        message: "3 itens cobertos, 1 não coberto (pintura do para-lama).",
      },
      {
        claimId: c4.id, actorId: ana.id, type: "MENSAGEM", createdAt: daysAgo(1),
        message: "Posso retirar amanhã às 10h?",
      },
    ],
  });

  // 5) NEGADO — Bruno, HB20, vidro
  await createClaim({
    policyId: hb20.policies[0].id,
    clientId: bruno.id,
    adjusterId: seguradora.id,
    type: "VIDROS",
    description: "Pedra lançada por caminhão trincou o para-brisa.",
    location: "Rod. dos Bandeirantes, km 40",
    occurredAt: daysAgo(60),
    createdAt: daysAgo(58),
    damages: [{ partKey: "parabrisa", severity: "MEDIO", note: "Trinca de 20cm" }],
    steps: [
      { to: "EM_ANALISE", by: seguradora.id, message: "Sinistro assumido para análise.", at: daysAgo(57) },
      {
        to: "NEGADO",
        by: seguradora.id,
        message: "Negado: apólice sem cobertura adicional de vidros.",
        at: daysAgo(56),
      },
    ],
  });

  await prisma.protocolSequence.create({ data: { year, last: seq } });

  console.log(`Seed concluído: 5 usuários, 3 veículos, ${seq} sinistros. Senha de todos: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
