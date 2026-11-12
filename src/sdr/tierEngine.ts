/**
 * src/sdr/tierEngine.ts
 * Motor de Tiers A/B/C e Persistência de Métricas (4 a 6 semanas)
 * Implementa a Regra de Ouro:
 * "Se o Tier A não converter pelo menos o dobro da taxa do Tier B, reduza o tempo dele."
 */

import fs from 'fs';
import path from 'path';
import { TierType, WeeklyTierStats, DynamicAdjustmentResult } from './types.js';

export interface TierStorageData {
  weeklyRecords: WeeklyTierStats[];
  currentWeek: number;
  totalStats: {
    [key in TierType]: {
      contacts: number;
      responses: number;
      meetings: number;
    };
  };
  allocation: {
    tierA: number; // % do tempo/esforço (ex: 50)
    tierB: number; // % do tempo/esforço (ex: 35)
    tierC: number; // % do tempo/esforço (ex: 15)
  };
  lastAdjustment?: DynamicAdjustmentResult;
}

const STORAGE_DIR = path.resolve('.data');
const STORAGE_FILE = path.join(STORAGE_DIR, 'sdr_tier_metrics.json');

export class TierEngine {
  private data: TierStorageData;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  }

  private getDefaultData(): TierStorageData {
    return {
      currentWeek: 1,
      weeklyRecords: [
        { week: 1, tier: 'A', contactsApproached: 50, responsesReceived: 16, meetingsBooked: 8, responseRate: 0.32, meetingConversionRate: 0.16 },
        { week: 1, tier: 'B', contactsApproached: 100, responsesReceived: 18, meetingsBooked: 6, responseRate: 0.18, meetingConversionRate: 0.06 },
        { week: 1, tier: 'C', contactsApproached: 150, responsesReceived: 12, meetingsBooked: 3, responseRate: 0.08, meetingConversionRate: 0.02 }
      ],
      totalStats: {
        A: { contacts: 50, responses: 16, meetings: 8 },
        B: { contacts: 100, responses: 18, meetings: 6 },
        C: { contacts: 150, responses: 12, meetings: 3 }
      },
      allocation: { tierA: 50, tierB: 35, tierC: 15 }
    };
  }

  private loadData(): TierStorageData {
    if (fs.existsSync(STORAGE_FILE)) {
      try {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        console.warn('Erro ao carregar sdr_tier_metrics.json, inicializando padrão.');
      }
    }
    const def = this.getDefaultData();
    this.saveData(def);
    return def;
  }

  private saveData(data: TierStorageData): void {
    try {
      this.ensureDirectory();
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e: any) {
      console.error('Erro ao salvar sdr_tier_metrics.json:', e.message);
    }
  }

  /**
   * Registra um evento de contato, resposta ou agendamento de reunião
   */
  public recordEvent(tier: TierType, event: 'contact' | 'response' | 'meeting', week?: number): void {
    const w = week || this.data.currentWeek;
    
    // Atualizar totalStats
    if (event === 'contact') this.data.totalStats[tier].contacts++;
    if (event === 'response') this.data.totalStats[tier].responses++;
    if (event === 'meeting') this.data.totalStats[tier].meetings++;

    // Atualizar weeklyRecords
    let record = this.data.weeklyRecords.find(r => r.week === w && r.tier === tier);
    if (!record) {
      record = {
        week: w,
        tier,
        contactsApproached: 0,
        responsesReceived: 0,
        meetingsBooked: 0,
        responseRate: 0,
        meetingConversionRate: 0
      };
      this.data.weeklyRecords.push(record);
    }

    if (event === 'contact') record.contactsApproached++;
    if (event === 'response') record.responsesReceived++;
    if (event === 'meeting') record.meetingsBooked++;

    if (record.contactsApproached > 0) {
      record.responseRate = Number((record.responsesReceived / record.contactsApproached).toFixed(4));
      record.meetingConversionRate = Number((record.meetingsBooked / record.contactsApproached).toFixed(4));
    }

    this.saveData(this.data);
  }

  /**
   * Avalia a regra de ouro: Se convRate(A) < 2 * convRate(B), reduz tempo do Tier A
   */
  public evaluateDynamicAdjustment(): DynamicAdjustmentResult {
    const statA = this.data.totalStats.A;
    const statB = this.data.totalStats.B;

    const rateA = statA.contacts > 0 ? statA.meetings / statA.contacts : 0;
    const rateB = statB.contacts > 0 ? statB.meetings / statB.contacts : 0;
    const thresholdRequired = 2 * rateB;

    const needsAdjustment = rateA < thresholdRequired;

    let recommended = { ...this.data.allocation };
    let reason = '';

    if (needsAdjustment) {
      // Reduz alocação do Tier A e repassa para Tier B
      recommended = {
        tierA: Math.max(25, this.data.allocation.tierA - 15),
        tierB: Math.min(55, this.data.allocation.tierB + 15),
        tierC: this.data.allocation.tierC
      };
      reason = `Alerta: Tier A converteu ${(rateA * 100).toFixed(1)}%, que é inferior ao dobro do Tier B (${(thresholdRequired * 100).toFixed(1)}%). Recomendada redução de tempo do Tier A para ${recommended.tierA}% e expansão do Tier B para ${recommended.tierB}%.`;
    } else {
      reason = `Desempenho aprovado: Tier A converteu ${(rateA * 100).toFixed(1)}%, superando a meta de dobro do Tier B (${(thresholdRequired * 100).toFixed(1)}%). Manter alta alocação de ${this.data.allocation.tierA}%.`;
    }

    const result: DynamicAdjustmentResult = {
      needsAdjustment,
      tierAConversionRate: Number(rateA.toFixed(4)),
      tierBConversionRate: Number(rateB.toFixed(4)),
      thresholdRequired: Number(thresholdRequired.toFixed(4)),
      currentAllocation: { ...this.data.allocation },
      recommendedAllocation: recommended,
      reason
    };

    this.data.lastAdjustment = result;
    this.saveData(this.data);

    return result;
  }

  /**
   * Aplica a recomendação de ajuste
   */
  public applyRecommendedAdjustment(): void {
    const adj = this.evaluateDynamicAdjustment();
    if (adj.needsAdjustment) {
      this.data.allocation = adj.recommendedAllocation;
      this.saveData(this.data);
    }
  }

  public getSnapshot(): TierStorageData {
    return JSON.parse(JSON.stringify(this.data));
  }

  public reset(): void {
    this.data = this.getDefaultData();
    this.saveData(this.data);
  }
}
