// Pino est remplacé par un logger factice pour vérifier les appels sans sortie réelle.
// L'instance est créée dans la factory (jest.mock est remonté avant les déclarations).
jest.mock('pino', () => {
  const instance = {
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  }
  const factory = Object.assign(jest.fn(() => instance), {
    stdTimeFunctions: { isoTime: jest.fn() },
    __instance: instance,
  })
  return { __esModule: true, default: factory, __instance: instance }
})

import { logger } from '@/lib/logger'

const mockPino = (jest.requireMock('pino') as { __instance: Record<string, jest.Mock> })
  .__instance

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('transmet les niveaux standards à pino', () => {
    logger.error('Test error')
    logger.warn('Test warning')
    logger.info('Test info')
    logger.debug('Test debug')

    expect(mockPino.error).toHaveBeenCalledWith('Test error')
    expect(mockPino.warn).toHaveBeenCalledWith('Test warning')
    expect(mockPino.info).toHaveBeenCalledWith('Test info')
    expect(mockPino.debug).toHaveBeenCalledWith('Test debug')
  })

  it('accepte un contexte structuré', () => {
    logger.info({ userId: '123', action: 'login' }, 'Test with context')
    expect(mockPino.info).toHaveBeenCalledWith(
      { userId: '123', action: 'login' },
      'Test with context'
    )
  })

  it('journalise les requêtes HTTP', () => {
    logger.logRequest('GET', '/api/users', 200, 150)
    expect(mockPino.info).toHaveBeenCalledWith(
      { method: 'GET', path: '/api/users', statusCode: 200, durationMs: 150 },
      'HTTP Request'
    )
  })

  it("masque l'email dans les logs d'authentification", () => {
    logger.logAuth('login', 'user123', 'test@example.com')
    expect(mockPino.info).toHaveBeenCalledWith(
      { action: 'login', userId: 'user123', email: 'te***@example.com' },
      'Auth: login'
    )
  })

  it('journalise les événements de sécurité en warn', () => {
    logger.logSecurity('RATE_LIMIT', { ip: '1.2.3.4' })
    expect(mockPino.warn).toHaveBeenCalledWith(
      { event: 'RATE_LIMIT', ip: '1.2.3.4' },
      'Security: RATE_LIMIT'
    )
  })
})
