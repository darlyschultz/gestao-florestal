import { prisma } from './helpers'

export async function seedSystemSettings() {
  await prisma.systemSettings.create({
    data: {
      companyName: 'Florestal Industrial S.A.',
      unitName: 'Fábrica Verde - Itatinga',
      unitCnpj: '08.765.432/0001-55',
      unitAddress: 'Rod. SP-127, Km 42, Zona Rural',
      factoryLatitude: -23.5489,
      factoryLongitude: -46.6388,
      factoryGeofenceRadiusMeters: 500,
      boardingGeofenceRadiusMeters: 300,
      weightTolerancePercent: 5,
      weightToleranceKg: 500,
      stopAlertMinutes: 30,
      delayAlertMinutes: 60,
      scheduleIntervalMinutes: 15,
      maxTrucksPerSlot: 3,
      requireNf: true,
      requireMdfe: true,
      requireLoadingOrder: true,
      requireBoardingLocation: true,
      requireGpsTracking: true,
      allowManualGateCheckin: true,
      allowManualBlock: true,
      operationalAlertEmail: 'operacao@florestal.com',
      gateOpenTime: '06:00',
      gateCloseTime: '22:00',
      notifyEmail: true,
      notifySystem: true,
      notifyPush: false,
    },
  })

  console.log('✅ Configurações do sistema criadas')
}
