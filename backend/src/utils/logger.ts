/**
 * Centralized Logging Utility
 * Provides structured logging with different log levels and context
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: number;
  agentId?: number;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

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
  rag(message: string, context?: LogContext): void {
    this.info(`[RAG] ${message}`, { component: 'RAG', ...context });
  }

  ragError(message: string, error?: Error, context?: LogContext): void {
    this.error(`[RAG] ${message}`, error, { component: 'RAG', ...context });
  }

  session(message: string, context?: LogContext): void {
    this.info(`[SESSION] ${message}`, { component: 'SESSION', ...context });
  }

  sessionError(message: string, error?: Error, context?: LogContext): void {
    this.error(`[SESSION] ${message}`, error, { component: 'SESSION', ...context });
  }

  agent(message: string, context?: LogContext): void {
    this.info(`[AGENT] ${message}`, { component: 'AGENT', ...context });
  }

  agentError(message: string, error?: Error, context?: LogContext): void {
    this.error(`[AGENT] ${message}`, error, { component: 'AGENT', ...context });
  }

  llm(message: string, context?: LogContext): void {
    this.info(`[LLM] ${message}`, { component: 'LLM', ...context });
  }

  llmError(message: string, error?: Error, context?: LogContext): void {
    this.error(`[LLM] ${message}`, error, { component: 'LLM', ...context });
  }

  frontend(message: string, context?: LogContext): void {
    this.info(`[FRONTEND] ${message}`, { component: 'FRONTEND', ...context });
  }

  frontendError(message: string, error?: Error, context?: LogContext): void {
    this.error(`[FRONTEND] ${message}`, error, { component: 'FRONTEND', ...context });
  }
}

export const logger = new Logger();
