/**
 * Frontend Logging Utility
 * Provides structured logging for frontend components
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  component?: string;
  sessionId?: number;
  agentId?: number;
  [key: string]: any;
}

class FrontendLogger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] [${level}]${contextStr} ${message}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedMessage);
        }
        break;
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (error) {
          console.error('Error details:', error);
        }
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Convenience methods for specific components
  home(message: string, context?: LogContext): void {
    this.info(`[HOME] ${message}`, { component: 'HomePage', ...context });
  }

  session(message: string, context?: LogContext): void {
    this.info(`[SESSION] ${message}`, { component: 'SessionsPage', ...context });
  }

  sessionError(message: string, error?: Error, context?: LogContext): void {
    this.error(`[SESSION] ${message}`, error, { component: 'SessionsPage', ...context });
  }

  agent(message: string, context?: LogContext): void {
    this.info(`[AGENT] ${message}`, { component: 'AgentStorePage', ...context });
  }

  agentError(message: string, error?: Error, context?: LogContext): void {
    this.error(`[AGENT] ${message}`, error, { component: 'AgentStorePage', ...context });
  }

  activeSession(message: string, context?: LogContext): void {
    this.info(`[ACTIVE_SESSION] ${message}`, { component: 'ActiveSessionPage', ...context });
  }

  activeSessionError(message: string, error?: Error, context?: LogContext): void {
    this.error(`[ACTIVE_SESSION] ${message}`, error, { component: 'ActiveSessionPage', ...context });
  }

  aiAnswer(message: string, context?: LogContext): void {
    this.info(`[AI_ANSWER] ${message}`, { component: 'AIAnswer', ...context });
  }

  aiAnswerError(message: string, error?: Error, context?: LogContext): void {
    this.error(`[AI_ANSWER] ${message}`, error, { component: 'AIAnswer', ...context });
  }

  rag(message: string, context?: LogContext): void {
    this.info(`[RAG] ${message}`, { component: 'RAG', ...context });
  }

  ragError(message: string, error?: Error, context?: LogContext): void {
    this.error(`[RAG] ${message}`, error, { component: 'RAG', ...context });
  }
}

export const logger = new FrontendLogger();
