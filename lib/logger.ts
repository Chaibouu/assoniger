/**
 * Système de logging structuré pour l'application
 * Supporte différents niveaux de log et formats
 */

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry;

    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }

    if (error) {
      formatted += ` | Error: ${error.message}`;
      if (this.isDevelopment && error.stack) {
        formatted += `\n${error.stack}`;
      }
    }

    return formatted;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const formatted = this.formatMessage(entry);

    // En production, on peut envoyer les erreurs à un service externe
    if (this.isProduction && level === "error") {
      // TODO: Intégrer avec Sentry, LogRocket, etc.
      console.error(formatted);
    } else {
      switch (level) {
        case "error":
          console.error(formatted);
          break;
        case "warn":
          console.warn(formatted);
          break;
        case "info":
          console.info(formatted);
          break;
        case "debug":
          if (this.isDevelopment) {
            console.debug(formatted);
          }
          break;
      }
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log("error", message, context, error);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log("warn", message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log("info", message, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log("debug", message, context);
  }

  // Méthodes spécialisées pour des cas d'usage courants
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number
  ) {
    this.info("HTTP Request", {
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
    });
  }

  logAuth(action: string, userId?: string, email?: string) {
    this.info(`Auth: ${action}`, {
      userId,
      email: email ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : undefined, // Masquer l'email
    });
  }

  logDatabase(operation: string, table: string, duration?: number) {
    this.debug(`DB: ${operation}`, {
      table,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
}

// Export d'une instance singleton
export const logger = new Logger();

// Export du type pour utilisation dans d'autres fichiers
export type { LogLevel, LogEntry };
